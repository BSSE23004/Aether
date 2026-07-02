// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CommunityRegistry
 * @notice Registry contract for managing communities with metadata and admin controls
 * @dev Handles community creation, metadata storage, and admin management
 */
contract CommunityRegistry is AccessControl, Ownable, ReentrancyGuard {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    uint256 private _communityIdCounter;

    struct Community {
        uint256 id;
        string name;
        string description;
        string metadataURI;
        address creator;
        address admin;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
        bool isVerified;
    }

    struct CommunityStats {
        uint256 memberCount;
        uint256 channelCount;
        uint256 messageCount;
    }

    // Community storage
    mapping(uint256 => Community) public communities;
    mapping(uint256 => CommunityStats) public communityStats;
    mapping(address => uint256[]) public userCommunities;
    mapping(string => bool) public communityNameExists;

    // Admin management
    mapping(uint256 => mapping(address => bool)) public communityAdmins;
    mapping(uint256 => address[]) public communityAdminList;

    // Verification tracking
    mapping(uint256 => bool) public verificationRequested;

    uint256 public totalCommunities;
    uint256 public activeCommunities;

    // Events
    event CommunityCreated(
        uint256 indexed communityId,
        string name,
        string metadataURI,
        address indexed creator,
        uint256 timestamp
    );
    event CommunityUpdated(
        uint256 indexed communityId,
        string name,
        string description,
        string metadataURI,
        uint256 timestamp
    );
    event CommunityDeactivated(
        uint256 indexed communityId,
        address indexed admin,
        uint256 timestamp
    );
    event CommunityActivated(
        uint256 indexed communityId,
        address indexed admin,
        uint256 timestamp
    );
    event CommunityAdminAdded(
        uint256 indexed communityId,
        address indexed admin,
        address indexed addedBy,
        uint256 timestamp
    );
    event CommunityAdminRemoved(
        uint256 indexed communityId,
        address indexed admin,
        address indexed removedBy,
        uint256 timestamp
    );
    event CommunityVerificationRequested(
        uint256 indexed communityId,
        address indexed requester,
        uint256 timestamp
    );
    event CommunityVerified(
        uint256 indexed communityId,
        address indexed verifier,
        uint256 timestamp
    );
    event CommunityStatsUpdated(
        uint256 indexed communityId,
        uint256 memberCount,
        uint256 channelCount,
        uint256 messageCount
    );

    // Errors
    error CommunityNotFound();
    error CommunityAlreadyExists();
    error CommunityNotActive();
    error UnauthorizedAccess();
    error InvalidMetadata();
    error AlreadyAdmin();
    error NotAdmin();
    error AdminRequired();

    /**
     * @notice Constructor to initialize the registry
     * @param _initialAdmin Address to grant initial admin role
     */
    constructor(address _initialAdmin) Ownable(_initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(ADMIN_ROLE, _initialAdmin);
        _grantRole(CREATOR_ROLE, _initialAdmin);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(MODERATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(CREATOR_ROLE, ADMIN_ROLE);
    }

    /**
     * @notice Create a new community
     * @param _name Community name
     * @param _description Community description
     * @param _metadataURI IPFS or HTTP URI for community metadata
     * @return communityId The ID of the newly created community
     */
    function createCommunity(
        string memory _name,
        string memory _description,
        string memory _metadataURI
    ) external nonCont onlyRole(CREATOR_ROLE) returns (uint256) {
        // Check if community name already exists
        require(!communityNameExists[_name], CommunityAlreadyExists());
        
        // Validate name and description
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_name).length <= 100, "Name too long");
        require(bytes(_description).length <= 500, "Description too long");

        // Validate metadata URI if provided
        if (bytes(_metadataURI).length > 0) {
            _validateMetadataURI(_metadataURI);
        }

        _communityIdCounter++;
        uint256 communityId = _communityIdCounter;

        communities[communityId] = Community({
            id: communityId,
            name: _name,
            description: _description,
            metadataURI: _metadataURI,
            creator: msg.sender,
            admin: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            isVerified: false
        });

        // Initialize stats
        communityStats[communityId] = CommunityStats({
            memberCount: 0,
            channelCount: 0,
            messageCount: 0
        });

        // Track community name
        communityNameExists[_name] = true;

        // Add creator as admin
        communityAdmins[communityId][msg.sender] = true;
        communityAdminList[communityId].push(msg.sender);

        // Track user communities
        userCommunities[msg.sender].push(communityId);

        // Update counters
        totalCommunities++;
        activeCommunities++;

        emit CommunityCreated(
            communityId,
            _name,
            _metadataURI,
            msg.sender,
            block.timestamp
        );

        return communityId;
    }

    /**
     * @notice Update community metadata
     * @param _communityId Community ID to update
     * @param _name New community name
     * @param _description New community description
     * @param _metadataURI New metadata URI
     */
    function updateCommunity(
        uint256 _communityId,
        string memory _name,
        string memory _description,
        string memory _metadataURI
    ) external nonCont {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(
            _isCommunityAdmin(_communityId, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            UnauthorizedAccess()
        );

        // Validate name if changed
        if (bytes(_name).length > 0 && keccak256(bytes(_name)) != keccak256(bytes(communities[_communityId].name))) {
            require(!communityNameExists[_name], CommunityAlreadyExists());
            require(bytes(_name).length <= 100, "Name too long");
            
            // Update name tracking
            communityNameExists[communities[_communityId].name] = false;
            communityNameExists[_name] = true;
        }

        // Validate description length
        if (bytes(_description).length > 0) {
            require(bytes(_description).length <= 500, "Description too long");
        }

        // Validate metadata URI if provided
        if (bytes(_metadataURI).length > 0) {
            _validateMetadataURI(_metadataURI);
        }

        // Update community data
        if (bytes(_name).length > 0) {
            communities[_communityId].name = _name;
        }
        if (bytes(_description).length > 0) {
            communities[_communityId].description = _description;
        }
        if (bytes(_metadataURI).length > 0) {
            communities[_communityId].metadataURI = _metadataURI;
        }
        communities[_communityId].updatedAt = block.timestamp;

        emit CommunityUpdated(
            _communityId,
            communities[_communityId].name,
            communities[_communityId].description,
            communities[_communityId].metadataURI,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a community
     * @param _communityId Community ID to deactivate
     */
    function deactivateCommunity(uint256 _communityId) external nonCont {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(
            _isCommunityAdmin(_communityId, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            UnauthorizedAccess()
        );

        communities[_communityId].isActive = false;
        activeCommunities--;

        emit CommunityDeactivated(_communityId, msg.sender, block.timestamp);
    }

    /**
     * @notice Reactivate a community
     * @param _communityId Community ID to reactivate
     */
    function activateCommunity(uint256 _communityId) external nonCont onlyRole(ADMIN_ROLE) {
        require(!communities[_communityId].isActive, "Community already active");

        communities[_communityId].isActive = true;
        activeCommunities++;

        emit CommunityActivated(_communityId, msg.sender, block.timestamp);
    }

    /**
     * @notice Add an admin to a community
     * @param _communityId Community ID
     * @param _admin Address to add as admin
     */
    function addCommunityAdmin(uint256 _communityId, address _admin) external nonCont {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(_admin != address(0), "Invalid address");
        require(
            _isCommunityAdmin(_communityId, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            UnauthorizedAccess()
        );
        require(!communityAdmins[_communityId][_admin], AlreadyAdmin());

        communityAdmins[_communityId][_admin] = true;
        communityAdminList[_communityId].push(_admin);

        emit CommunityAdminAdded(_communityId, _admin, msg.sender, block.timestamp);
    }

    /**
     * @notice Remove an admin from a community
     * @param _communityId Community ID
     * @param _admin Address to remove as admin
     */
    function removeCommunityAdmin(uint256 _communityId, address _admin) external nonCont {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(
            _isCommunityAdmin(_communityId, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            UnauthorizedAccess()
        );
        require(communityAdmins[_communityId][_admin], NotAdmin());
        
        // Cannot remove the creator
        require(communities[_communityId].creator != _admin, "Cannot remove creator");

        communityAdmins[_communityId][_admin] = false;

        // Remove from admin list
        _removeAddressFromArray(communityAdminList[_communityId], _admin);

        emit CommunityAdminRemoved(_communityId, _admin, msg.sender, block.timestamp);
    }

    /**
     * @notice Request verification for a community
     * @param _communityId Community ID to verify
     */
    function requestVerification(uint256 _communityId) external nonCont {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(
            _isCommunityAdmin(_communityId, msg.sender),
            UnauthorizedAccess()
        );
        require(!communities[_communityId].isVerified, "Already verified");
        require(!verificationRequested[_communityId], "Already requested");

        verificationRequested[_communityId] = true;

        emit CommunityVerificationRequested(_communityId, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a community (platform admin only)
     * @param _communityId Community ID to verify
     */
    function verifyCommunity(uint256 _communityId) external nonCont onlyRole(ADMIN_ROLE) {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(verificationRequested[_communityId], "No verification request");

        communities[_communityId].isVerified = true;
        verificationRequested[_communityId] = false;

        emit CommunityVerified(_communityId, msg.sender, block.timestamp);
    }

    /**
     * @notice Update community statistics
     * @param _communityId Community ID
     * @param _memberCount New member count
     * @param _channelCount New channel count
     * @param _messageCount New message count
     */
    function updateCommunityStats(
        uint256 _communityId,
        uint256 _memberCount,
        uint256 _channelCount,
        uint256 _messageCount
    ) external nonCont {
        require(communities[_communityId].isActive, CommunityNotActive());
        require(
            _isCommunityAdmin(_communityId, msg.sender) || hasRole(MODERATOR_ROLE, msg.sender),
            UnauthorizedAccess()
        );

        communityStats[_communityId] = CommunityStats({
            memberCount: _memberCount,
            channelCount: _channelCount,
            messageCount: _messageCount
        });

        emit CommunityStatsUpdated(_communityId, _memberCount, _channelCount, _messageCount);
    }

    // View functions

    /**
     * @notice Get community details
     * @param _communityId Community ID
     * @return Community struct with all details
     */
    function getCommunity(uint256 _communityId) external view returns (Community memory) {
        require(communities[_communityId].id != 0, CommunityNotFound());
        return communities[_communityId];
    }

    /**
     * @notice Get community statistics
     * @param _communityId Community ID
     * @return CommunityStats struct with statistics
     */
    function getCommunityStats(uint256 _communityId) external view returns (CommunityStats memory) {
        require(communities[_communityId].id != 0, CommunityNotFound());
        return communityStats[_communityId];
    }

    /**
     * @notice Get all communities for a user
     * @param _user User address
     * @return Array of community IDs
     */
    function getUserCommunities(address _user) external view returns (uint256[] memory) {
        return userCommunities[_user];
    }

    /**
     * @notice Get all admins for a community
     * @param _communityId Community ID
     * @return Array of admin addresses
     */
    function getCommunityAdmins(uint256 _communityId) external view returns (address[] memory) {
        return communityAdminList[_communityId];
    }

    /**
     * @notice Check if an address is an admin of a community
     * @param _communityId Community ID
     * @param _admin Address to check
     * @return Boolean indicating if address is admin
     */
    function isCommunityAdmin(uint256 _communityId, address _admin) external view returns (bool) {
        return communityAdmins[_communityId][_admin];
    }

    /**
     * @notice Get paginated list of active communities
     * @param _offset Starting index
     * @param _limit Number of communities to return
     * @return Array of community IDs
     */
    function getActiveCommunities(uint256 _offset, uint256 _limit) external view returns (uint256[] memory) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        
        uint256[] memory result = new uint256[](_limit);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalCommunities && count < _limit; i++) {
            if (communities[i].isActive && i > _offset) {
                result[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        assembly {
            mstore(result, count)
        }
        
        return result;
    }

    /**
     * @notice Get total number of communities
     * @return Total communities count
     */
    function getTotalCommunities() external view returns (uint256) {
        return totalCommunities;
    }

    /**
     * @notice Get number of active communities
     * @return Active communities count
     */
    function getActiveCommunitiesCount() external view returns (uint256) {
        return activeCommunities;
    }

    // Internal functions

    function _isCommunityAdmin(uint256 _communityId, address _admin) internal view returns (bool) {
        return communityAdmins[_communityId][_admin];
    }

    function _validateMetadataURI(string memory _uri) internal pure {
        bytes memory uriBytes = bytes(_uri);
        require(uriBytes.length > 0, InvalidMetadata());
        require(uriBytes.length <= 500, "Metadata URI too long");
        
        // Basic validation for IPFS or HTTP(S)
        if (uriBytes.length >= 7) {
            string memory prefix = "";
            for (uint i = 0; i < 7; i++) {
                prefix = string(abi.encodePacked(prefix, bytes1(uriBytes[i])));
            }
            
            bytes memory prefixBytes = bytes(prefix);
            bool isValid = 
                (prefixBytes[0] == 'i' && prefixBytes[1] == 'p' && prefixBytes[2] == 'f' && prefixBytes[3] == 's' && prefixBytes[4] == ':') || // ipfs:
                (prefixBytes[0] == 'h' && prefixBytes[1] == 't' && prefixBytes[2] == 't' && prefixBytes[3] == 'p' && prefixBytes[4] == ':') || // http:
                (prefixBytes[0] == 'h' && prefixBytes[1] == 't' && prefixBytes[2] == 't' && prefixBytes[3] == 'p' && prefixBytes[4] == 's' && prefixBytes[5] == ':'); // https:
            
            require(isValid, "Invalid metadata URI format");
        }
    }

    function _removeAddressFromArray(address[] storage array, address _address) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == _address) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
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