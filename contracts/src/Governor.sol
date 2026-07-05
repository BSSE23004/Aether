// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IVotingToken {
    function getVotes(address account) external view returns (uint256);
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256);
    function delegate(address delegatee) external;
}

contract Governor is AccessControl {
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

    error NotMembershipHolder();
    error InvalidMembershipContract();
    error InvalidProposalThreshold();
    error InvalidVotingDelay();
    error InvalidVotingPeriod();
    error NotAuthorized();

    event MembershipContractUpdated(address indexed oldContract, address indexed newContract);
    event VotingParametersUpdated(uint256 votingDelay, uint256 votingPeriod, uint256 proposalThreshold);

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

    function isMembershipHolder(address _account) public view returns (bool) {
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

    function setMembershipContract(address _newMembershipContract) external onlyRole(ADMIN_ROLE) {
        require(_newMembershipContract != address(0), "Invalid address");
        address oldContract = membershipContract;
        membershipContract = _newMembershipContract;
        emit MembershipContractUpdated(oldContract, _newMembershipContract);
    }

    function setVotingParameters(
        uint256 _newVotingDelay,
        uint256 _newVotingPeriod,
        uint256 _newProposalThreshold
    ) external onlyRole(ADMIN_ROLE) {
        require(_newVotingDelay > 0, "Invalid voting delay");
        require(_newVotingPeriod > 0, "Invalid voting period");
        require(_newProposalThreshold > 0, "Invalid proposal threshold");

        votingDelay = _newVotingDelay;
        votingPeriod = _newVotingPeriod;
        proposalThreshold = _newProposalThreshold;

        emit VotingParametersUpdated(_newVotingDelay, _newVotingPeriod, _newProposalThreshold);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        if (!_hasVotingPower(msg.sender)) revert NotMembershipHolder();

        uint256 votingPower = token.getVotes(msg.sender);
        if (votingPower <= proposalThreshold) {
            revert("Governor: proposer votes below proposal threshold");
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

        return proposalId;
    }

    function castVote(uint256 proposalId, uint8 support) public returns (uint256) {
        if (!isMembershipHolder(msg.sender)) revert NotMembershipHolder();

        Proposal storage proposal = proposals[proposalId];
        require(!proposal.canceled, "Governor: proposal already canceled");
        require(!proposal.executed, "Governor: proposal already executed");
        require(block.timestamp >= proposal.createdAt + votingDelay, "Governor: vote currently not allowed");
        require(block.timestamp <= proposal.createdAt + votingDelay + votingPeriod, "Governor: vote already closed");
        require(!hasVoted[proposalId][msg.sender], "Governor: already voted");

        uint256 votingPower = token.getVotes(msg.sender);

        if (support == 1) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }

        hasVoted[proposalId][msg.sender] = true;
        voters[proposalId].push(msg.sender);

        return 1;
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public returns (uint256) {
        if (!hasRole(EXECUTOR_ROLE, msg.sender)) revert NotAuthorized();

        Proposal storage proposal = proposals[proposalCount - 1];
        require(!proposal.canceled, "Governor: proposal already canceled");
        require(!proposal.executed, "Governor: proposal already executed");
        require(state(proposalCount - 1) == ProposalState.Succeeded, "Governor: proposal not successful");

        proposal.executed = true;
        return proposalCount - 1;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public returns (uint256) {
        Proposal storage proposal = proposals[proposalCount - 1];
        require(!proposal.executed, "Governor: proposal already executed");
        require(!proposal.canceled, "Governor: proposal already canceled");
        require(block.timestamp < proposal.createdAt + votingDelay, "Governor: proposal cannot be cancelled");

        proposal.canceled = true;
        return proposalCount - 1;
    }

    function proposalDeadline(uint256 proposalId) public view returns (uint256) {
        return proposals[proposalId].createdAt + votingDelay + votingPeriod;
    }

    function quorum(uint256 blockNumber) public view returns (uint256) {
        return token.getPastTotalSupply(blockNumber) / 10;
    }

    function _quorumReached(uint256 proposalId) public view returns (bool) {
        uint256 requiredQuorum = quorum(block.timestamp);
        for (uint256 i = 0; i < voters[proposalId].length; i++) {
            if (token.getVotes(voters[proposalId][i]) >= requiredQuorum) {
                return true;
            }
        }
        return false;
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) return ProposalState.Canceled;
        if (proposal.executed) return ProposalState.Executed;

        if (block.timestamp < proposal.createdAt + votingDelay) {
            return ProposalState.Pending;
        }

        if (block.timestamp < proposal.createdAt + votingDelay + votingPeriod) {
            return ProposalState.Active;
        }

        if (_quorumReached(proposalId) && proposal.forVotes >= proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}