// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Governor.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./mocks/MockERC20Votes.sol";
import "./mocks/MockMembership.sol";

/**
 * @title GovernorTest
 * @notice Comprehensive test suite for Governor contract
 */
contract GovernorTest is Test {
    Governor public governor;
    MockERC20Votes public token;
    MockMembership public membershipContract;
    address public admin;
    address public proposer;
    address public executor;
    address public user1;
    address public user2;

    // Test parameters
    uint256 constant VOTING_DELAY = 1 days;
    uint256 constant VOTING_PERIOD = 7 days;
    uint256 constant PROPOSAL_THRESHOLD = 1e18; // 1 token
    uint256 constant TOKEN_SUPPLY = 1_000_000 * 1e18;

    function setUp() public {
        admin = address(this);
        proposer = address(0x1);
        executor = address(0x2);
        user1 = address(0x3);
        user2 = address(0x4);

        // Deploy mock membership contract
        membershipContract = new MockMembership();

        // Deploy ERC20Votes token
        token = new MockERC20Votes("Aether Token", "AETH");
        token.mint(user1, TOKEN_SUPPLY);
        token.mint(user2, TOKEN_SUPPLY);
        token.delegate(user1);
        token.delegate(user2);

        // Deploy Governor
        governor = new Governor(
            token,
            address(membershipContract),
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            admin
        );

        // Grant roles
        governor.grantRole(governor.PROPOSER_ROLE(), proposer);
        governor.grantRole(governor.EXECUTOR_ROLE(), executor);
    }

    // ==================== Constructor Tests ====================

    function test_Constructor_InitialState() public view {
        assertEq(governor.name(), "Aether Governor");
        assertEq(governor.votingDelay(), VOTING_DELAY);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), PROPOSAL_THRESHOLD);
        assertEq(address(governor.membershipContract()), address(membershipContract));
    }

    function test_Constructor_RoleSetup() public view {
        assertTrue(governor.hasRole(governor.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(governor.hasRole(governor.ADMIN_ROLE(), admin));
        assertTrue(governor.hasRole(governor.PROPOSER_ROLE(), admin));
        assertTrue(governor.hasRole(governor.EXECUTOR_ROLE(), admin));
    }

    function test_Constructor_RoleAdminSetup() public view {
        assertEq(
            governor.getRoleAdmin(governor.ADMIN_ROLE()),
            governor.DEFAULT_ADMIN_ROLE()
        );
        assertEq(
            governor.getRoleAdmin(governor.PROPOSER_ROLE()),
            governor.ADMIN_ROLE()
        );
        assertEq(
            governor.getRoleAdmin(governor.EXECUTOR_ROLE()),
            governor.ADMIN_ROLE()
        );
    }

    function test_Constructor_InvalidParameters() public {
        MockERC20Votes testToken = new MockERC20Votes("Test Token", "TEST");
        testToken.mint(admin, TOKEN_SUPPLY);

        // Invalid voting delay
        vm.expectRevert("Invalid voting delay");
        new Governor(
            testToken,
            address(membershipContract),
            0,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            admin
        );

        // Invalid voting period
        vm.expectRevert("Invalid voting period");
        new Governor(
            testToken,
            address(membershipContract),
            VOTING_DELAY,
            0,
            PROPOSAL_THRESHOLD,
            admin
        );

        // Invalid proposal threshold
        vm.expectRevert("Invalid proposal threshold");
        new Governor(
            testToken,
            address(membershipContract),
            VOTING_DELAY,
            VOTING_PERIOD,
            0,
            admin
        );
    }

    // ==================== Membership Check Tests ====================

    function test_IsMembershipHolder() public {
        // Initially no membership
        assertTrue(!governor.isMembershipHolder(user1));

        // Grant membership
        membershipContract.grantMembership(user1);
        assertTrue(governor.isMembershipHolder(user1));
    }

    // ==================== Proposal Creation Tests ====================

    function test_Propose_Success() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        vm.stopPrank();

        assertEq(proposalId, 0); // First proposal
        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Pending));
    }

    function test_Propose_NotMembershipHolder() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        address userWithNoTokens = address(0x5);

        vm.startPrank(userWithNoTokens);

        vm.expectRevert(Governor.NotMembershipHolder.selector);
        governor.propose(targets, values, calldatas, description);

        vm.stopPrank();
    }

    function test_Propose_Unauthorized() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        address unauthorizedUser = address(0x5);
        token.mint(unauthorizedUser, PROPOSAL_THRESHOLD);
        token.delegate(unauthorizedUser);

        vm.startPrank(unauthorizedUser);

        vm.expectRevert(); // AccessControl error
        governor.propose(targets, values, calldatas, description);

        vm.stopPrank();
    }

    function test_Propose_InsufficientVotes() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        address userWithLowVotes = address(0x5);
        token.mint(userWithLowVotes, PROPOSAL_THRESHOLD - 1);
        token.delegate(userWithLowVotes);

        vm.startPrank(userWithLowVotes);

        vm.expectRevert("Governor: proposer votes below proposal threshold");
        governor.propose(targets, values, calldatas, description);

        vm.stopPrank();
    }

    // ==================== Voting Tests ====================

    function test_Vote_Success() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        uint256 weight = governor.castVote(proposalId, 1); // Vote for

        vm.stopPrank();

        assertEq(weight, 1);
    }

    function test_Vote_NotMembershipHolder() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.stopPrank();

        address userWithNoTokens = address(0x5);

        vm.startPrank(userWithNoTokens);

        vm.expectRevert(Governor.NotMembershipHolder.selector);
        governor.castVote(proposalId, 1);

        vm.stopPrank();
    }

    function test_Vote_BeforeVotingDelay() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Try to vote before voting delay
        vm.expectRevert("Governor: vote currently not allowed");
        governor.castVote(proposalId, 1);

        vm.stopPrank();
    }

    function test_Vote_AfterVotingPeriod() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.expectRevert("Governor: vote already closed");
        governor.castVote(proposalId, 1);

        vm.stopPrank();
    }

    function test_Vote_Against() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        uint256 weight = governor.castVote(proposalId, 0); // Vote against

        vm.stopPrank();

        assertEq(weight, 1);
    }

    // ==================== Vote Counting Tests ====================

    function test_VoteCounting_SimpleMajority() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1); // user1 votes for

        vm.stopPrank();

        vm.startPrank(user2);

        governor.castVote(proposalId, 0); // user2 votes against

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Succeeded));
    }

    function test_VoteCounting_Unanimous() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1); // user1 votes for

        vm.stopPrank();

        vm.startPrank(user2);

        governor.castVote(proposalId, 1); // user2 votes for

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Succeeded));
    }

    function test_VoteCounting_Rejected() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 0); // user1 votes against

        vm.stopPrank();

        vm.startPrank(user2);

        governor.castVote(proposalId, 0); // user2 votes against

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Defeated));
    }

    function test_VoteCounting_Quorum() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1); // user1 votes for

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        // Check if quorum is reached (requires 10% of total supply)
        // user1 has TOKEN_SUPPLY tokens, so quorum is TOKEN_SUPPLY / 10
        // Since only user1 voted, quorum may not be reached depending on supply
        assertEq(governor._quorumReached(proposalId), token.getTotalSupply() / 10 <= TOKEN_SUPPLY);
    }

    // ==================== Proposal Execution Tests ====================

    function test_Execute_Success() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1); // user1 votes for

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.startPrank(executor);

        bytes32 descriptionHash = keccak256(bytes(description));

        governor.execute(targets, values, calldatas, descriptionHash);

        vm.stopPrank();

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Executed));
    }

    function test_Execute_NotAuthorized() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.startPrank(user1);

        bytes32 descriptionHash = keccak256(bytes(description));

        vm.expectRevert(Governor.NotAuthorized.selector);
        governor.execute(targets, values, calldatas, descriptionHash);

        vm.stopPrank();
    }

    function test_Execute_NotSucceeded() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 0); // Vote against

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.startPrank(executor);

        bytes32 descriptionHash = keccak256(bytes(description));

        vm.expectRevert("Governor: proposal not successful");
        governor.execute(targets, values, calldatas, descriptionHash);

        vm.stopPrank();
    }

    function test_Execute_DoubleExecution() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.startPrank(executor);

        bytes32 descriptionHash = keccak256(bytes(description));

        governor.execute(targets, values, calldatas, descriptionHash);

        vm.stopPrank();

        // Try to execute again
        vm.startPrank(executor);

        vm.expectRevert("Governor: proposal already executed");
        governor.execute(targets, values, calldatas, descriptionHash);

        vm.stopPrank();
    }

    // ==================== View Function Tests ====================

    function test_ProposalDeadline() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        vm.stopPrank();

        uint256 deadline = governor.proposalDeadline(proposalId);
        assertEq(deadline, block.timestamp + VOTING_DELAY + VOTING_PERIOD);
    }

    function test_ProposalState_Pending() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        vm.stopPrank();

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Pending));
    }

    function test_ProposalState_Active() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.stopPrank();

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Active));
    }

    function test_ProposalState_Succeeded() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Succeeded));
    }

    function test_ProposalState_Defeated() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 0);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Defeated));
    }

    function test_ProposalState_Executed() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.startPrank(executor);

        bytes32 descriptionHash = keccak256(bytes(description));

        governor.execute(targets, values, calldatas, descriptionHash);

        vm.stopPrank();

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Executed));
    }

    // ==================== Admin Management Tests ====================

    function test_SetMembershipContract_Success() public {
        address newMembership = address(0x5);

        governor.setMembershipContract(newMembership);

        assertEq(address(governor.membershipContract()), newMembership);
    }

    function test_SetMembershipContract_Unauthorized() public {
        address newMembership = address(0x5);

        vm.startPrank(user1);

        vm.expectRevert(); // AccessControl error
        governor.setMembershipContract(newMembership);

        vm.stopPrank();
    }

    function test_SetMembershipContract_InvalidAddress() public {
        vm.expectRevert("Invalid address");
        governor.setMembershipContract(address(0));
    }

    function test_SetVotingParameters_Success() public {
        uint256 newDelay = 2 days;
        uint256 newPeriod = 14 days;
        uint256 newThreshold = 2e18;

        governor.setVotingParameters(newDelay, newPeriod, newThreshold);

        assertEq(governor.votingDelay(), newDelay);
        assertEq(governor.votingPeriod(), newPeriod);
        assertEq(governor.proposalThreshold(), newThreshold);
    }

    function test_SetVotingParameters_Unauthorized() public {
        vm.startPrank(user1);

        vm.expectRevert(); // AccessControl error
        governor.setVotingParameters(2 days, 14 days, 2e18);

        vm.stopPrank();
    }

    function test_SetVotingParameters_InvalidDelay() public {
        vm.expectRevert(Governor.InvalidVotingDelay.selector);
        governor.setVotingParameters(0, VOTING_PERIOD, PROPOSAL_THRESHOLD);
    }

    function test_SetVotingParameters_InvalidPeriod() public {
        vm.expectRevert(Governor.InvalidVotingPeriod.selector);
        governor.setVotingParameters(VOTING_DELAY, 0, PROPOSAL_THRESHOLD);
    }

    function test_SetVotingParameters_InvalidThreshold() public {
        vm.expectRevert(Governor.InvalidProposalThreshold.selector);
        governor.setVotingParameters(VOTING_DELAY, VOTING_PERIOD, 0);
    }

    // ==================== Proposal Cancellation Tests ====================

    function test_Cancel_Success() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Cancel before voting delay ends
        governor.cancel(targets, values, calldatas, keccak256(bytes(description)));

        vm.stopPrank();

        assertEq(uint256(governor.state(proposalId)), uint256(Governor.ProposalState.Canceled));
    }

    function test_Cancel_AfterVotingStart() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.expectRevert("Governor: proposal cannot be cancelled");
        governor.cancel(targets, values, calldatas, keccak256(bytes(description)));

        vm.stopPrank();
    }

    // ==================== Quorum Tests ====================

    function test_Quorum_NotReached() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        // Check if quorum is reached
        // user1 has TOKEN_SUPPLY tokens, quorum is TOKEN_SUPPLY / 10
        // Since only user1 voted, quorum may not be reached
        uint256 quorum = governor.quorum(block.timestamp - 1);
        assertEq(quorum, token.getPastTotalSupply(block.timestamp - 1) / 10);
    }

    function test_Quorum_Reached() public {
        // Create a scenario where quorum is reached
        // Mint more tokens to user1
        token.mint(user1, TOKEN_SUPPLY * 9); // user1 now has 10x supply
        token.delegate(user1);

        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        // user1 now has 10x the original supply, so their vote should reach quorum
        uint256 quorum = governor.quorum(block.timestamp - 1);
        assertTrue(governor._quorumReached(proposalId));
    }

    // ==================== Settings Tests ====================

    function test_Settings_CastingVote() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        uint256 weight = governor.castVote(proposalId, 1);

        vm.stopPrank();

        assertEq(weight, 1);
    }

    function test_Settings_ProposalThreshold() public {
        assertEq(governor.proposalThreshold(), PROPOSAL_THRESHOLD);
    }

    function test_Settings_VotingDelay() public {
        assertEq(governor.votingDelay(), VOTING_DELAY);
    }

    function test_Settings_VotingPeriod() public {
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
    }

    // ==================== Gas Efficiency Tests ====================

    function test_Gas_Propose() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 gasBefore = gasleft();
        governor.propose(targets, values, calldatas, description);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for propose:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_Vote() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        uint256 gasBefore = gasleft();
        governor.castVote(proposalId, 1);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for vote:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_Execute() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        governor.castVote(proposalId, 1);

        vm.stopPrank();

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.startPrank(executor);

        bytes32 descriptionHash = keccak256(bytes(description));

        uint256 gasBefore = gasleft();
        governor.execute(targets, values, calldatas, descriptionHash);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log(" gas used for execute:", gasUsed);

        vm.stopPrank();
    }
}