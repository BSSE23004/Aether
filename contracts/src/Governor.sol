// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVotingToken {
    function getVotes(address account) external view returns (uint256);
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256);
    function delegate(address delegatee) external;
}

/**
 * @title Governor
 * @notice DAO governance contract for the Aether platform
 * @dev Handles proposal creation, voting, vote counting, and on-chain execution.
 *      Uses AccessControl for role-based permissions and ReentrancyGuard for
 *      safe execution of arbitrary on-chain calls.
 */
contract Governor is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    enum ProposalState {
        Pending,
        Active,
        Succeeded,
        Defeated,
        Canceled,
        Executed
    }

    struct Proposal {
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 createdAt;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
    }

    IVotingToken public token;
    address public membershipContract;
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;
    uint256 public proposalCount;
    string public name;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => address[]) public voters;

    // ==================== Errors ====================

    error NotMembershipHolder();
    error InvalidMembershipContract();
    error InvalidProposalThreshold();
    error InvalidVotingDelay();
    error InvalidVotingPeriod();
    error NotAuthorized();
    error ProposalAlreadyCanceled();
    error ProposalAlreadyExecuted();
    error ProposalNotSucceeded();
    error VotingNotOpen();
    error VotingClosed();
    error AlreadyVoted();
    error InvalidArrayLength();
    error CallFailed(uint256 index);
    error CancelWindowClosed();
    error InsufficientVotingPower();

    // ==================== Events ====================

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        uint256 createdAt,
        uint256 voteStart,
        uint256 voteEnd
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    event ProposalCanceled(uint256 indexed proposalId);

    event MembershipContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );

    event VotingParametersUpdated(
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold
    );

    // ==================== Constructor ====================

    constructor(
        IVotingToken _token,
        address _membershipContract,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        address _initialAdmin
    ) {
        require(_membershipContract != address(0), "Invalid membership contract");
        require(_votingDelay > 0, "Invalid voting delay");
        require(_votingPeriod > 0, "Invalid voting period");
        require(_proposalThreshold > 0, "Invalid proposal threshold");

        token = _token;
        membershipContract = _membershipContract;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        name = "Aether Governor";

        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(ADMIN_ROLE, _initialAdmin);
        _grantRole(PROPOSER_ROLE, _initialAdmin);
        _grantRole(EXECUTOR_ROLE, _initialAdmin);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PROPOSER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(EXECUTOR_ROLE, ADMIN_ROLE);
    }

    // ==================== Membership Checks ====================

    /**
     * @notice Check if an account holds membership (via voting power or membership contract)
     * @param _account The address to check
     * @return True if the account is a membership holder
     */
    function isMembershipHolder(address _account) public view returns (bool) {
        if (token.getVotes(_account) > 0) return true;

        if (membershipContract == address(0)) return false;

        (bool success, bytes memory data) = membershipContract.staticcall(
            abi.encodeWithSignature("hasMembership(address)", _account)
        );

        if (!success || data.length == 0) return false;
        return abi.decode(data, (bool));
    }

    function _hasVotingPower(address _account) internal view returns (bool) {
        return token.getVotes(_account) > 0;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Update the membership contract address
     * @param _newMembershipContract New membership contract address
     */
    function setMembershipContract(
        address _newMembershipContract
    ) external onlyRole(ADMIN_ROLE) {
        require(_newMembershipContract != address(0), "Invalid address");
        address oldContract = membershipContract;
        membershipContract = _newMembershipContract;
        emit MembershipContractUpdated(oldContract, _newMembershipContract);
    }

    /**
     * @notice Update voting parameters
     * @param _newVotingDelay New voting delay in seconds
     * @param _newVotingPeriod New voting period in seconds
     * @param _newProposalThreshold New proposal threshold (minimum voting power)
     */
    function setVotingParameters(
        uint256 _newVotingDelay,
        uint256 _newVotingPeriod,
        uint256 _newProposalThreshold
    ) external onlyRole(ADMIN_ROLE) {
        if (_newVotingDelay == 0) revert InvalidVotingDelay();
        if (_newVotingPeriod == 0) revert InvalidVotingPeriod();
        if (_newProposalThreshold == 0) revert InvalidProposalThreshold();

        votingDelay = _newVotingDelay;
        votingPeriod = _newVotingPeriod;
        proposalThreshold = _newProposalThreshold;

        emit VotingParametersUpdated(
            _newVotingDelay,
            _newVotingPeriod,
            _newProposalThreshold
        );
    }

    // ==================== Proposal Lifecycle ====================

    /**
     * @notice Compute a deterministic proposal ID from its parameters
     * @param targets Target contract addresses
     * @param values ETH values for each call
     * @param calldatas Encoded function calls
     * @param descriptionHash Hash of the proposal description
     * @return The computed proposal ID
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public pure returns (uint256) {
        return uint256(
            keccak256(abi.encode(targets, values, calldatas, descriptionHash))
        );
    }

    /**
     * @notice Create a new proposal
     * @param targets Target contract addresses to call
     * @param values ETH values for each call
     * @param calldatas Encoded function calls
     * @param description Human-readable proposal description
     * @return proposalId The sequential proposal ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        if (!_hasVotingPower(msg.sender)) revert NotMembershipHolder();

        uint256 votingPower = token.getVotes(msg.sender);
        if (votingPower < proposalThreshold) {
            revert InsufficientVotingPower();
        }

        if (targets.length != values.length || targets.length != calldatas.length) {
            revert InvalidArrayLength();
        }

        uint256 proposalId = proposalCount;
        proposalCount++;

        Proposal storage proposal = proposals[proposalId];
        proposal.proposer = msg.sender;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.description = description;
        proposal.createdAt = block.timestamp;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            description,
            block.timestamp,
            block.timestamp + votingDelay,
            block.timestamp + votingDelay + votingPeriod
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId The proposal to vote on
     * @param support 0 = against, 1 = for, 2 = abstain
     * @return weight The voting weight applied
     */
    function castVote(
        uint256 proposalId,
        uint8 support
    ) public returns (uint256) {
        if (!isMembershipHolder(msg.sender)) revert NotMembershipHolder();

        Proposal storage proposal = proposals[proposalId];
        if (proposal.canceled) revert ProposalAlreadyCanceled();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (block.timestamp < proposal.createdAt + votingDelay) {
            revert VotingNotOpen();
        }
        if (block.timestamp > proposal.createdAt + votingDelay + votingPeriod) {
            revert VotingClosed();
        }
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 votingPower = token.getVotes(msg.sender);

        if (support == 1) {
            proposal.forVotes += votingPower;
        } else if (support == 0) {
            proposal.againstVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        hasVoted[proposalId][msg.sender] = true;
        voters[proposalId].push(msg.sender);

        emit VoteCast(msg.sender, proposalId, support, votingPower);

        return votingPower;
    }

    /**
     * @notice Execute a succeeded proposal, making actual on-chain calls
     * @param proposalId The proposal to execute
     * @param targets Target contract addresses (must match proposal)
     * @param values ETH values for each call (must match proposal)
     * @param calldatas Encoded function calls (must match proposal)
     */
    function execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) public nonReentrant {
        if (!hasRole(EXECUTOR_ROLE, msg.sender)) revert NotAuthorized();

        Proposal storage proposal = proposals[proposalId];
        if (proposal.canceled) revert ProposalAlreadyCanceled();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (state(proposalId) != ProposalState.Succeeded) {
            revert ProposalNotSucceeded();
        }

        proposal.executed = true;

        // Execute all calls on-chain
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(calldatas[i]);
            if (!success) revert CallFailed(i);
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (only before voting starts)
     * @param proposalId The proposal to cancel
     */
    function cancel(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.canceled) revert ProposalAlreadyCanceled();

        // Only proposer or admin can cancel
        require(
            proposal.proposer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Governor: not proposer or admin"
        );

        // Can only cancel before voting starts
        if (block.timestamp >= proposal.createdAt + votingDelay) {
            revert CancelWindowClosed();
        }

        proposal.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get the deadline (end of voting period) for a proposal
     * @param proposalId The proposal ID
     * @return The timestamp when voting ends
     */
    function proposalDeadline(
        uint256 proposalId
    ) public view returns (uint256) {
        return
            proposals[proposalId].createdAt + votingDelay + votingPeriod;
    }

    /**
     * @notice Compute the quorum required (10% of total supply at a given timepoint)
     * @param timepoint The block timestamp to query supply at
     * @return The minimum number of votes needed for quorum
     */
    function quorum(uint256 timepoint) public view returns (uint256) {
        return token.getPastTotalSupply(timepoint) / 10;
    }

    /**
     * @notice Check if quorum has been reached for a proposal
     * @dev Quorum is reached when total votes (for + against + abstain) >= 10% of supply
     * @param proposalId The proposal ID
     * @return True if quorum is reached
     */
    function quorumReached(uint256 proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes +
            proposal.againstVotes +
            proposal.abstainVotes;
        uint256 requiredQuorum = quorum(proposal.createdAt);
        return totalVotes >= requiredQuorum;
    }

    /**
     * @notice Get the current state of a proposal
     * @param proposalId The proposal ID
     * @return The current ProposalState
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) return ProposalState.Canceled;
        if (proposal.executed) return ProposalState.Executed;

        if (block.timestamp < proposal.createdAt + votingDelay) {
            return ProposalState.Pending;
        }

        if (
            block.timestamp < proposal.createdAt + votingDelay + votingPeriod
        ) {
            return ProposalState.Active;
        }

        // Voting ended — check result
        if (
            quorumReached(proposalId) &&
            proposal.forVotes > proposal.againstVotes
        ) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /**
     * @notice Get the vote totals for a proposal
     * @param proposalId The proposal ID
     * @return forVotes The number of votes for
     * @return againstVotes The number of votes against
     * @return abstainVotes The number of abstain votes
     */
    function proposalVotes(
        uint256 proposalId
    )
        public
        view
        returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes)
    {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.forVotes, proposal.againstVotes, proposal.abstainVotes);
    }

    // ==================== Interface Support ====================

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Allow the Governor to receive ETH (for funded proposal execution)
    receive() external payable {}
}