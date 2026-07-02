// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Governor
 * @notice OpenZeppelin-based Governor contract for Aether DAO governance
 * @dev Uses OpenZeppelin Governor modules for secure, standardized governance
 */
contract Governor is
    Governor,
    GovernorCountingSimple,
    GovernorSettings,
    GovernorVotes,
    AccessControl,
    ReentrancyGuard
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    address public membershipContract;
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;

    // Custom errors for gas efficiency
    error NotMembershipHolder();
    error InvalidProposalThreshold();
    error InvalidVotingDelay();
    error InvalidVotingPeriod();
    error NotAuthorized();

    event MembershipContractUpdated(address indexed oldContract, address indexed newContract);
    event VotingParametersUpdated(uint256 votingDelay, uint256 votingPeriod, uint256 proposalThreshold);

    /**
     * @notice Constructor to initialize the Governor
     * @param _token The ERC20Votes token used for voting
     * @param _membershipContract The membership NFT contract
     * @param _votingDelay Delay before voting can start
     * @param _votingPeriod Duration of voting period
     * @param _proposalThreshold Minimum votes required to propose
     * @param _initialAdmin Address to grant initial admin role
     */
    constructor(
        ERC20Votes _token,
        address _membershipContract,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        address _initialAdmin
    ) Governor("Aether Governor") GovernorVotes(_token) {
        require(_membershipContract != address(0), "Invalid membership contract");
        require(_votingDelay > 0, "Invalid voting delay");
        require(_votingPeriod > 0, "Invalid voting period");
        require(_proposalThreshold > 0, "Invalid proposal threshold");

        membershipContract = _membershipContract;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;

        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(ADMIN_ROLE, _initialAdmin);
        _grantRole(PROPOSER_ROLE, _initialAdmin);
        _grantRole(EXECUTOR_ROLE, _initialAdmin);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PROPOSER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(EXECUTOR_ROLE, ADMIN_ROLE);
    }

    /**
     * @notice Check if address is a membership holder
     * @param _account Address to check
     * @return isHolder Whether the address holds membership NFT
     */
    function isMembershipHolder(address _account) public view returns (bool) {
        // This would require calling the membership contract
        // For now, we'll assume that voting power is based on token holdings
        return IERC20Votes(token).getVotes(_account) > 0;
    }

    /**
     * @notice Set the membership contract address
     * @param _newMembershipContract New membership contract address
     */
    function setMembershipContract(address _newMembershipContract) external onlyRole(ADMIN_ROLE) {
        require(_newMembershipContract != address(0), "Invalid address");
        address oldContract = membershipContract;
        membershipContract = _newMembershipContract;
        emit MembershipContractUpdated(oldContract, _newMembershipContract);
    }

    /**
     * @notice Update voting parameters
     * @param _newVotingDelay New voting delay
     * @param _newVotingPeriod New voting period
     * @param _newProposalThreshold New proposal threshold
     */
    function setVotingParameters(
        uint256 _newVotingDelay,
        uint256 _newVotingPeriod,
        uint256 _newProposalThreshold
    ) external onlyRole(ADMIN_ROLE) {
        require(_newVotingDelay > 0, InvalidVotingDelay());
        require(_newVotingPeriod > 0, InvalidVotingPeriod());
        require(_newProposalThreshold > 0, InvalidProposalThreshold());

        votingDelay = _newVotingDelay;
        votingPeriod = _newVotingPeriod;
        proposalThreshold = _newProposalThreshold;

        emit VotingParametersUpdated(_newVotingDelay, _newVotingPeriod, _newProposalThreshold);
    }

    /**
     * @notice Override proposal creation to add membership check
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        if (!isMembershipHolder(msg.sender)) revert NotMembershipHolder();
        return super.propose(targets, values, calldatas, description);
    }

    /**
     * @notice Override vote to add membership check
     */
    function vote(uint256 proposalId, uint8 support) public override returns (uint256) {
        if (!isMembershipHolder(msg.sender)) revert NotMembershipHolder();
        return super.vote(proposalId, support);
    }

    /**
     * @notice Override proposal execution to add authorization check
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256) {
        if (!hasRole(EXECUTOR_ROLE, msg.sender)) revert NotAuthorized();
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Required Governor overrides
     */
    function votingDelay() public pure override returns (uint256) {
        return votingDelay;
    }

    function votingPeriod() public pure override returns (uint256) {
        return votingPeriod;
    }

    function proposalThreshold() public pure override returns (uint256) {
        return proposalThreshold;
    }

    function quorum(uint256 blockNumber)
        public
        view
        override
        returns (uint256)
    {
        // 10% quorum requirement
        return token.getPastTotalSupply(blockNumber) / 10;
    }

    function state(uint256 proposalId)
        public
        view
        override
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalDeadline(uint256 proposalId)
        public
        view
        override
        returns (uint256)
    {
        return super.proposalDeadline(proposalId);
    }

    function _quorumReached(uint256 proposalId)
        internal
        view
        override
        returns (bool)
    {
        return super._quorumReached(proposalId);
    }

    function _voteSucceeded(uint256 proposalId)
        internal
        view
        override
        returns (bool)
    {
        return super._voteSucceeded(proposalId);
    }

    function _cancel(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override
        returns (uint256)
    {
        return super._cancel(proposalId, targets, values, calldases, descriptionHash);
    }

    function _executor()
        internal
        view
        override
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorSettings, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}