// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AetherGovernance
 * @notice Governance contract for Aether DAO proposals
 * @dev Handles proposal creation, voting, and execution
 */
contract AetherGovernance is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public membershipContract;
    uint256 public votingPeriod;
    uint256 public quorumPercentage;

    enum ProposalState {
        Pending,
        Active,
        Passed,
        Rejected,
        Executed
    }

    struct Proposal {
        string title;
        string description;
        address proposer;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        ProposalState state;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public totalProposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address indexed proposer
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(
        address _membershipContract,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) {
        membershipContract = _membershipContract;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createProposal(
        string memory _title,
        string memory _description
    ) external nonCont returns (uint256) {
        totalProposals++;
        uint256 proposalId = totalProposals;

        proposals[proposalId] = Proposal({
            title: _title,
            description: _description,
            proposer: msg.sender,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            state: ProposalState.Active,
            executed: false
        });

        emit ProposalCreated(proposalId, _title, msg.sender);
        return proposalId;
    }

    function vote(uint256 _proposalId, bool _support) external nonCont {
        require(proposals[_proposalId].state == ProposalState.Active, "Not active");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(
            block.timestamp <= proposals[_proposalId].createdAt + votingPeriod,
            "Voting ended"
        );

        hasVoted[_proposalId][msg.sender] = true;

        if (_support) {
            proposals[_proposalId].votesFor++;
        } else {
            proposals[_proposalId].votesAgainst++;
        }

        emit Voted(_proposalId, msg.sender, _support);
    }

    function executeProposal(uint256 _proposalId) external nonCont {
        require(!proposals[_proposalId].executed, "Already executed");
        require(
            proposals[_proposalId].state == ProposalState.Passed,
            "Not passed"
        );

        proposals[_proposalId].executed = true;
        proposals[_proposalId].state = ProposalState.Executed;
        emit ProposalExecuted(_proposalId);
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getProposalState(uint256 _proposalId) external view returns (ProposalState) {
        Proposal memory proposal = proposals[_proposalId];
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp > proposal.createdAt + votingPeriod) {
            // Voting ended, determine result
            uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
            if (totalVotes == 0) {
                return ProposalState.Rejected;
            }
            
            // Simple majority for now
            if (proposal.votesFor > proposal.votesAgainst) {
                return ProposalState.Passed;
            } else {
                return ProposalState.Rejected;
            }
        }
        
        return proposal.state;
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