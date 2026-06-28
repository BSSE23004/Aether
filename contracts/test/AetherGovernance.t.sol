// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AetherGovernance.sol";
import "../src/AetherMembership.sol";

/**
 * @title AetherGovernanceTest
 * @notice Test suite for AetherGovernance contract
 */
contract AetherGovernanceTest is Test {
    AetherGovernance public governance;
    AetherMembership public membership;
    address public admin;
    address public user1;
    address public user2;

    uint256 constant VOTING_PERIOD = 7 days;
    uint256 constant QUORUM_PERCENTAGE = 10;

    function setUp() public {
        admin = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        membership = new AetherMembership("Aether Membership", "AETH", 0.01 ether);
        governance = new AetherGovernance(
            address(membership),
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        );
    }

    function test_InitialState() public view {
        assertEq(address(governance.membershipContract()), address(membership));
        assertEq(governance.votingPeriod(), VOTING_PERIOD);
        assertEq(governance.quorumPercentage(), QUORUM_PERCENTAGE);
        assertEq(governance.totalProposals(), 0);
    }

    function test_CreateProposal() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        
        assertEq(proposalId, 1);
        assertEq(governance.totalProposals(), 1);
        
        (string memory title, string memory description, address proposer, , , , , ) = governance.getProposal(proposalId);
        assertEq(title, "Test Proposal");
        assertEq(description, "Test Description");
        assertEq(proposer, user1);
        
        vm.stopPrank();
    }

    function test_Vote() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        governance.vote(proposalId, true);
        
        (, , , , uint256 votesFor, uint256 votesAgainst, , ) = governance.getProposal(proposalId);
        assertEq(votesFor, 1);
        assertEq(votesAgainst, 0);
        assertTrue(governance.hasVoted(proposalId, user1));
        
        vm.stopPrank();
    }

    function test_Vote_AlreadyVoted() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        governance.vote(proposalId, true);
        
        vm.expectRevert("Already voted");
        governance.vote(proposalId, false);
        
        vm.stopPrank();
    }

    function test_Vote_AfterVotingPeriod() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        
        vm.stopPrank();
        
        warp(block.timestamp + VOTING_PERIOD + 1);
        
        vm.startPrank(user1);
        
        vm.expectRevert("Voting ended");
        governance.vote(proposalId, true);
        
        vm.stopPrank();
    }

    function test_ExecuteProposal() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        governance.vote(proposalId, true);
        
        vm.stopPrank();
        
        // Fast forward past voting period
        warp(block.timestamp + VOTING_PERIOD + 1);
        
        // Proposal should be passed
        assertEq(uint256(governance.getProposalState(proposalId)), uint256(AetherGovernance.ProposalState.Passed));
        
        vm.startPrank(user1);
        
        governance.executeProposal(proposalId);
        
        (, , , , , , , bool executed) = governance.getProposal(proposalId);
        assertTrue(executed);
        
        vm.stopPrank();
    }

    function test_ExecuteProposal_NotPassed() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        
        vm.stopPrank();
        
        // Fast forward past voting period with no votes
        warp(block.timestamp + VOTING_PERIOD + 1);
        
        vm.startPrank(user1);
        
        vm.expectRevert("Not passed");
        governance.executeProposal(proposalId);
        
        vm.stopPrank();
    }

    function test_GetProposalState() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        
        // Should be Active
        assertEq(uint256(governance.getProposalState(proposalId)), uint256(AetherGovernance.ProposalState.Active));
        
        governance.vote(proposalId, true);
        
        vm.stopPrank();
        
        // Fast forward past voting period
        warp(block.timestamp + VOTING_PERIOD + 1);
        
        // Should be Passed
        assertEq(uint256(governance.getProposalState(proposalId)), uint256(AetherGovernance.ProposalState.Passed));
    }

    function test_MultipleVotes() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        governance.vote(proposalId, true);
        
        vm.stopPrank();
        
        vm.startPrank(user2);
        
        governance.vote(proposalId, false);
        
        (, , , , uint256 votesFor, uint256 votesAgainst, , ) = governance.getProposal(proposalId);
        assertEq(votesFor, 1);
        assertEq(votesAgainst, 1);
        
        vm.stopPrank();
    }

    function test_ExecuteProposal_Unauthorized() public {
        vm.startPrank(user1);
        
        uint256 proposalId = governance.createProposal("Test Proposal", "Test Description");
        governance.vote(proposalId, true);
        
        vm.stopPrank();
        
        // Fast forward past voting period
        warp(block.timestamp + VOTING_PERIOD + 1);
        
        vm.startPrank(user2);
        
        vm.expectRevert();
        governance.executeProposal(proposalId);
        
        vm.stopPrank();
    }
}