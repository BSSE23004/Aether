// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AetherCommunity
 * @notice Main community contract for Aether platform
 * @dev Manages community registry and on-chain community data
 */
contract AetherCommunity is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    address public membershipContract;
    address public governanceContract;

    string public name;
    string public description;
    uint256 public totalCommunities;

    struct Community {
        string name;
        string description;
        address creator;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Community) public communities;
    mapping(address => uint256[]) public userCommunities;

    event CommunityCreated(
        uint256 indexed communityId,
        string name,
        address indexed creator
    );
    event CommunityUpdated(
        uint256 indexed communityId,
        string name,
        string description
    );
    event CommunityDeactivated(uint256 indexed communityId);

    constructor(
        address _membershipContract,
        address _governanceContract,
        string memory _name,
        string memory _description
    ) {
        membershipContract = _membershipContract;
        governanceContract = _governanceContract;
        name = _name;
        description = _description;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createCommunity(
        string memory _name,
        string memory _description
    ) external nonCont returns (uint256) {
        totalCommunities++;
        uint256 communityId = totalCommunities;

        communities[communityId] = Community({
            name: _name,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });

        userCommunities[msg.sender].push(communityId);

        emit CommunityCreated(communityId, _name, msg.sender);
        return communityId;
    }

    function updateCommunity(
        uint256 _communityId,
        string memory _name,
        string memory _description
    ) external onlyRole(ADMIN_ROLE) {
        require(communities[_communityId].isActive, "Community not active");
        communities[_communityId].name = _name;
        communities[_communityId].description = _description;
        emit CommunityUpdated(_communityId, _name, _description);
    }

    function deactivateCommunity(uint256 _communityId) external onlyRole(ADMIN_ROLE) {
        require(communities[_communityId].isActive, "Community not active");
        communities[_communityId].isActive = false;
        emit CommunityDeactivated(_communityId);
    }

    function getUserCommunities(address _user) external view returns (uint256[] memory) {
        return userCommunities[_user];
    }

    function getCommunity(uint256 _communityId) external view returns (Community memory) {
        return communities[_communityId];
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