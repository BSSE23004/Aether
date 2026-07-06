// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Governor.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./mocks/MockERC20Votes.sol";
import "./mocks/MockMembership.sol";

/// @notice Simple target contract for testing on-chain execution
contract ExecutionTarget {
    uint256 public value;
    bool public called;

    function setValue(uint256 _value) external payable {
        value = _value;
        called = true;
    }

    function failingFunction() external pure {
        revert("intentional failure");
    }

    receive() external payable {}
}

/**
 * @title GovernorTest
 * @notice Comprehensive test suite for Governor contract
 */
contract GovernorTest is Test {
    Governor public governor;
    MockERC20Votes public token;
    MockMembership public membershipContract;
    ExecutionTarget public target;
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

        // Delegate votes (must happen after minting)
        vm.prank(user1);
        token.delegate(user1);
        vm.prank(user2);
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
        // Also grant executor role to admin for convenience
        governor.grantRole(governor.EXECUTOR_ROLE(), admin);

        // Deploy execution target
        target = new ExecutionTarget();

        // Fund the governor for execution tests
        vm.deal(address(governor), 10 ether);
    }

    // ==================== Helper Functions ====================

    function _createEmptyProposal(address sender) internal returns (uint256) {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        vm.prank(sender);
        return governor.propose(targets, values, calldatas, description);
    }

    function _createExecutableProposal(
        address sender,
        uint256 targetValue
    ) internal returns (uint256, address[] memory, uint256[] memory, bytes[] memory) {
        address[] memory targets = new address[](1);
        targets[0] = address(target);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ExecutionTarget.setValue.selector,
            targetValue
        );

        string memory description = "Execute setValue proposal";

        vm.prank(sender);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            description
        );

        return (proposalId, targets, values, calldatas);
    }

    // ==================== Constructor Tests ====================

    function test_Constructor_InitialState() public view {
        assertEq(governor.name(), "Aether Governor");
        assertEq(governor.votingDelay(), VOTING_DELAY);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), PROPOSAL_THRESHOLD);
        assertEq(
            address(governor.membershipContract()),
            address(membershipContract)
        );
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

    function test_IsMembershipHolder_WithVotingPower() public view {
        // user1 has delegated votes, so isMembershipHolder returns true
        assertTrue(governor.isMembershipHolder(user1));
    }

    function test_IsMembershipHolder_WithoutAnyPower() public view {
        // Address with no tokens and no membership
        address nobody = address(0x99);
        assertFalse(governor.isMembershipHolder(nobody));
    }

    function test_IsMembershipHolder_ViaMembershipContract() public {
        address memberOnly = address(0x55);
        assertFalse(governor.isMembershipHolder(memberOnly));

        // Grant membership via mock
        membershipContract.grantMembership(memberOnly);
        assertTrue(governor.isMembershipHolder(memberOnly));
    }

    // ==================== Proposal Creation Tests ====================

    function test_Propose_Success() public {
        uint256 proposalId = _createEmptyProposal(user1);

        assertEq(proposalId, 0); // First proposal
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Pending)
        );
    }

    function test_Propose_EmitsEvent() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        vm.expectEmit(true, true, false, false);
        emit Governor.ProposalCreated(
            0,
            user1,
            targets,
            values,
            calldatas,
            description,
            block.timestamp,
            block.timestamp + VOTING_DELAY,
            block.timestamp + VOTING_DELAY + VOTING_PERIOD
        );

        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);
    }

    function test_Propose_NotMembershipHolder() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        address userWithNoTokens = address(0x5);

        vm.prank(userWithNoTokens);
        vm.expectRevert(Governor.NotMembershipHolder.selector);
        governor.propose(targets, values, calldatas, description);
    }

    function test_Propose_InsufficientVotes() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        string memory description = "Test proposal";

        address userWithLowVotes = address(0x5);
        token.mint(userWithLowVotes, PROPOSAL_THRESHOLD - 1);
        vm.prank(userWithLowVotes);
        token.delegate(userWithLowVotes);

        vm.prank(userWithLowVotes);
        vm.expectRevert(Governor.InsufficientVotingPower.selector);
        governor.propose(targets, values, calldatas, description);
    }

    function test_Propose_ExactThreshold() public {
        // With the fixed `<` check, exactly threshold should work
        address userExact = address(0x6);
        token.mint(userExact, PROPOSAL_THRESHOLD);
        vm.prank(userExact);
        token.delegate(userExact);

        vm.prank(userExact);
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        uint256 id = governor.propose(targets, values, calldatas, "exact threshold test");
        assertEq(id, 0);
    }

    function test_Propose_InvalidArrayLength() public {
        address[] memory targets = new address[](1);
        targets[0] = address(target);
        uint256[] memory values = new uint256[](0); // mismatched length
        bytes[] memory calldatas = new bytes[](0);

        vm.prank(user1);
        vm.expectRevert(Governor.InvalidArrayLength.selector);
        governor.propose(targets, values, calldatas, "bad arrays");
    }

    // ==================== Voting Tests ====================

    function test_Vote_Success() public {
        uint256 proposalId = _createEmptyProposal(user1);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        uint256 weight = governor.castVote(proposalId, 1); // Vote for

        assertEq(weight, TOKEN_SUPPLY);
    }

    function test_Vote_EmitsEvent() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.expectEmit(true, true, false, true);
        emit Governor.VoteCast(user1, proposalId, 1, TOKEN_SUPPLY);

        vm.prank(user1);
        governor.castVote(proposalId, 1);
    }

    function test_Vote_NotMembershipHolder() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        address userWithNoTokens = address(0x5);

        vm.prank(userWithNoTokens);
        vm.expectRevert(Governor.NotMembershipHolder.selector);
        governor.castVote(proposalId, 1);
    }

    function test_Vote_BeforeVotingDelay() public {
        uint256 proposalId = _createEmptyProposal(user1);

        // Try to vote before voting delay
        vm.prank(user1);
        vm.expectRevert(Governor.VotingNotOpen.selector);
        governor.castVote(proposalId, 1);
    }

    function test_Vote_AfterVotingPeriod() public {
        uint256 proposalId = _createEmptyProposal(user1);

        // Fast forward past voting period
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        vm.prank(user1);
        vm.expectRevert(Governor.VotingClosed.selector);
        governor.castVote(proposalId, 1);
    }

    function test_Vote_Against() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        uint256 weight = governor.castVote(proposalId, 0); // Vote against

        assertEq(weight, TOKEN_SUPPLY);

        (, uint256 againstVotes, ) = governor.proposalVotes(proposalId);
        assertEq(againstVotes, TOKEN_SUPPLY);
    }

    function test_Vote_Abstain() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        uint256 weight = governor.castVote(proposalId, 2); // Abstain

        assertEq(weight, TOKEN_SUPPLY);

        (, , uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(abstainVotes, TOKEN_SUPPLY);
    }

    function test_Vote_DoubleVotePrevented() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.startPrank(user1);
        governor.castVote(proposalId, 1);

        vm.expectRevert(Governor.AlreadyVoted.selector);
        governor.castVote(proposalId, 0);
        vm.stopPrank();
    }

    // ==================== Vote Counting Tests ====================

    function test_VoteCounting_SimpleMajority() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1); // user1 votes for

        vm.prank(user2);
        governor.castVote(proposalId, 0); // user2 votes against

        // Same voting power = forVotes not > againstVotes = Defeated (tie goes to defeated)
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // Equal votes means NOT succeeded (forVotes must be > againstVotes)
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Defeated)
        );
    }

    function test_VoteCounting_Unanimous() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1); // user1 votes for

        vm.prank(user2);
        governor.castVote(proposalId, 1); // user2 votes for

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Succeeded)
        );
    }

    function test_VoteCounting_Rejected() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 0); // user1 votes against

        vm.prank(user2);
        governor.castVote(proposalId, 0); // user2 votes against

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Defeated)
        );
    }

    function test_VoteCounting_ProposalVotesView() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.prank(user2);
        governor.castVote(proposalId, 0);

        (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) = governor
            .proposalVotes(proposalId);
        assertEq(forVotes, TOKEN_SUPPLY);
        assertEq(againstVotes, TOKEN_SUPPLY);
        assertEq(abstainVotes, 0);
    }

    function test_VoteCounting_Quorum() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // user1 has TOKEN_SUPPLY tokens, quorum = total supply / 10
        // user1 voted, so totalVotes = TOKEN_SUPPLY >= quorum
        assertTrue(governor.quorumReached(proposalId));
    }

    // ==================== Proposal Execution Tests ====================

    function test_Execute_Success_OnChain() public {
        // Create a proposal that calls target.setValue(42)
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 42);

        // Vote for it
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // Move past voting period
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // Execute (admin has EXECUTOR_ROLE)
        governor.execute(proposalId, targets, values, calldatas);

        // Verify on-chain execution actually happened
        assertEq(target.value(), 42);
        assertTrue(target.called());
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Executed)
        );
    }

    function test_Execute_WithETHTransfer() public {
        // Create a proposal that sends 1 ETH to the target
        address[] memory targets = new address[](1);
        targets[0] = address(target);

        uint256[] memory values = new uint256[](1);
        values[0] = 1 ether;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ExecutionTarget.setValue.selector,
            100
        );

        vm.prank(user1);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "ETH transfer proposal"
        );

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        uint256 targetBalanceBefore = address(target).balance;
        governor.execute(proposalId, targets, values, calldatas);
        assertEq(address(target).balance, targetBalanceBefore + 1 ether);
    }

    function test_Execute_EmitsEvent() public {
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 99);

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectEmit(true, false, false, false);
        emit Governor.ProposalExecuted(proposalId);

        governor.execute(proposalId, targets, values, calldatas);
    }

    function test_Execute_NotAuthorized() public {
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 1);

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // user1 doesn't have EXECUTOR_ROLE
        vm.prank(user1);
        vm.expectRevert(Governor.NotAuthorized.selector);
        governor.execute(proposalId, targets, values, calldatas);
    }

    function test_Execute_NotSucceeded() public {
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 1);

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 0); // Vote against
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectRevert(Governor.ProposalNotSucceeded.selector);
        governor.execute(proposalId, targets, values, calldatas);
    }

    function test_Execute_DoubleExecution() public {
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 1);

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governor.execute(proposalId, targets, values, calldatas);

        // Try to execute again
        vm.expectRevert(Governor.ProposalAlreadyExecuted.selector);
        governor.execute(proposalId, targets, values, calldatas);
    }

    function test_Execute_CallFailed() public {
        // Create proposal that calls a failing function
        address[] memory targets = new address[](1);
        targets[0] = address(target);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ExecutionTarget.failingFunction.selector
        );

        vm.prank(user1);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "failing proposal"
        );

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectRevert(abi.encodeWithSelector(Governor.CallFailed.selector, 0));
        governor.execute(proposalId, targets, values, calldatas);
    }

    // ==================== View Function Tests ====================

    function test_ProposalDeadline() public {
        uint256 proposalId = _createEmptyProposal(user1);

        uint256 deadline = governor.proposalDeadline(proposalId);
        assertEq(deadline, block.timestamp + VOTING_DELAY + VOTING_PERIOD);
    }

    function test_ProposalState_Pending() public {
        uint256 proposalId = _createEmptyProposal(user1);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Pending)
        );
    }

    function test_ProposalState_Active() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Active)
        );
    }

    function test_ProposalState_Succeeded() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Succeeded)
        );
    }

    function test_ProposalState_Defeated() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 0);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Defeated)
        );
    }

    function test_ProposalState_Executed() public {
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 1);

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governor.execute(proposalId, targets, values, calldatas);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Executed)
        );
    }

    // ==================== Admin Management Tests ====================

    function test_SetMembershipContract_Success() public {
        address newMembership = address(0x5);

        governor.setMembershipContract(newMembership);

        assertEq(address(governor.membershipContract()), newMembership);
    }

    function test_SetMembershipContract_Unauthorized() public {
        address newMembership = address(0x5);

        vm.prank(user1);
        vm.expectRevert(); // AccessControl error
        governor.setMembershipContract(newMembership);
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
        vm.prank(user1);
        vm.expectRevert(); // AccessControl error
        governor.setVotingParameters(2 days, 14 days, 2e18);
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
        uint256 proposalId = _createEmptyProposal(user1);

        // Cancel before voting delay ends (proposer can cancel)
        vm.prank(user1);
        governor.cancel(proposalId);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Canceled)
        );
    }

    function test_Cancel_ByAdmin() public {
        uint256 proposalId = _createEmptyProposal(user1);

        // Admin can also cancel
        governor.cancel(proposalId);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(Governor.ProposalState.Canceled)
        );
    }

    function test_Cancel_EmitsEvent() public {
        uint256 proposalId = _createEmptyProposal(user1);

        vm.expectEmit(true, false, false, false);
        emit Governor.ProposalCanceled(proposalId);

        vm.prank(user1);
        governor.cancel(proposalId);
    }

    function test_Cancel_AfterVotingStart() public {
        uint256 proposalId = _createEmptyProposal(user1);

        // Fast forward past voting delay
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        vm.expectRevert(Governor.CancelWindowClosed.selector);
        governor.cancel(proposalId);
    }

    // ==================== Quorum Tests ====================

    function test_Quorum_ReachedWithSingleVoter() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        assertTrue(governor.quorumReached(proposalId));
    }

    function test_Quorum_NotReachedWithNoVotes() public {
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);

        // No votes at all — but quorum may be 0 depending on getPastTotalSupply
        // With the fixed mock, quorum = totalSupply / 10, and no votes = 0
        // so 0 >= quorum is only true if quorum is 0
        // Since we minted tokens, quorum > 0, so this should be false
        assertFalse(governor.quorumReached(proposalId));
    }

    // ==================== Settings Tests ====================

    function test_Settings_ProposalThreshold() public view {
        assertEq(governor.proposalThreshold(), PROPOSAL_THRESHOLD);
    }

    function test_Settings_VotingDelay() public view {
        assertEq(governor.votingDelay(), VOTING_DELAY);
    }

    function test_Settings_VotingPeriod() public view {
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
    }

    // ==================== HashProposal Tests ====================

    function test_HashProposal_Deterministic() public view {
        address[] memory targets = new address[](1);
        targets[0] = address(target);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            ExecutionTarget.setValue.selector,
            42
        );

        bytes32 descHash = keccak256(bytes("test"));

        uint256 hash1 = governor.hashProposal(
            targets,
            values,
            calldatas,
            descHash
        );
        uint256 hash2 = governor.hashProposal(
            targets,
            values,
            calldatas,
            descHash
        );

        assertEq(hash1, hash2);
    }

    // ==================== Receive ETH Tests ====================

    function test_ReceiveETH() public {
        uint256 balBefore = address(governor).balance;
        vm.deal(address(this), 5 ether);
        (bool sent, ) = address(governor).call{value: 1 ether}("");
        assertTrue(sent);
        assertEq(address(governor).balance, balBefore + 1 ether);
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
        uint256 proposalId = _createEmptyProposal(user1);
        vm.warp(block.timestamp + VOTING_DELAY + 1);

        vm.startPrank(user1);

        uint256 gasBefore = gasleft();
        governor.castVote(proposalId, 1);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for vote:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_Execute() public {
        (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        ) = _createExecutableProposal(user1, 42);

        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        uint256 gasBefore = gasleft();
        governor.execute(proposalId, targets, values, calldatas);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for execute:", gasUsed);
    }

    // ==================== Interface Tests ====================

    function test_SupportsInterface() public view {
        // Should support AccessControl interface
        assertTrue(governor.supportsInterface(type(IAccessControl).interfaceId));
    }

    // ==================== Multi-Proposal Tests ====================

    function test_MultipleProposals_IndependentState() public {
        uint256 id1 = _createEmptyProposal(user1);
        uint256 id2 = _createEmptyProposal(user1);

        assertEq(id1, 0);
        assertEq(id2, 1);

        vm.warp(block.timestamp + VOTING_DELAY + 1);

        // Vote for on proposal 1, against on proposal 2
        vm.prank(user1);
        governor.castVote(id1, 1);

        vm.prank(user1);
        governor.castVote(id2, 0);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        assertEq(
            uint256(governor.state(id1)),
            uint256(Governor.ProposalState.Succeeded)
        );
        assertEq(
            uint256(governor.state(id2)),
            uint256(Governor.ProposalState.Defeated)
        );
    }
}