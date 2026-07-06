// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MembershipPass
 * @notice Gas-efficient ERC721 membership NFT for Aether platform
 * @dev Optimized membership pass with burning, validity checks, and metadata support
 */
contract MembershipPass is ERC721, ERC721Enumerable, AccessControl, Ownable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 private _tokenIdCounter;

    uint256 public membershipPrice;
    address public treasury;
    uint256 public maxSupply;
    uint256 public totalMinted;
    uint256 public totalBurned;

    // Gas-efficient storage using uint256 instead of struct
    mapping(uint256 => address) public tokenOwner;
    mapping(uint256 => uint256) public mintedAt;
    mapping(uint256 => string) public tokenMetadata;
    mapping(address => uint256) public userMembershipCount;
    mapping(address => uint256) public membershipExpiry;

    // Events
    event MembershipMinted(
        uint256 indexed tokenId,
        address indexed member,
        uint256 price,
        uint256 timestamp
    );
    event MembershipBurned(
        uint256 indexed tokenId,
        address indexed member,
        uint256 timestamp
    );
    event MembershipPriceUpdated(uint256 newPrice, uint256 timestamp);
    event TreasuryUpdated(address newTreasury, uint256 timestamp);
    event MaxSupplyUpdated(uint256 newMaxSupply, uint256 timestamp);
    event MembershipExtended(
        uint256 indexed tokenId,
        address indexed member,
        uint256 newExpiry,
        uint256 timestamp
    );

    // Custom errors for gas efficiency
    error ZeroAddress();
    error InsufficientPayment();
    error InvalidTokenId();
    error NotTokenOwner();
    error MaxSupplyReached();
    error InvalidExpiry();
    error NotAuthorized();
    error MetadataTooLong();
    error TokenNotBurnable();

    /**
     * @notice Constructor to initialize the membership pass
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _membershipPrice Price for membership
     * @param _maxSupply Maximum number of passes (0 for unlimited)
     * @param _initialAdmin Address to grant initial admin role
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _membershipPrice,
        uint256 _maxSupply,
        address _initialAdmin
    ) ERC721(_name, _symbol) Ownable(_initialAdmin) {
        membershipPrice = _membershipPrice;
        maxSupply = _maxSupply;
        treasury = _initialAdmin;
        _tokenIdCounter = 0;

        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(ADMIN_ROLE, _initialAdmin);
        _grantRole(MINTER_ROLE, _initialAdmin);
        _grantRole(BURNER_ROLE, _initialAdmin);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(BURNER_ROLE, ADMIN_ROLE);
    }

    /**
     * @notice Mint a new membership pass
     * @param _to Address to mint the pass to
     * @param _metadataURI Metadata URI for the pass
     * @param _expiry Expiry timestamp (0 for permanent)
     * @return tokenId The ID of the minted pass
     */
    function mintMembership(
        address _to,
        string memory _metadataURI,
        uint256 _expiry
    ) external payable nonReentrant returns (uint256) {
        if (_to == address(0)) revert ZeroAddress();
        if (msg.value < membershipPrice) revert InsufficientPayment();
        if (maxSupply > 0 && totalMinted >= maxSupply) revert MaxSupplyReached();
        if (_expiry != 0 && _expiry <= block.timestamp) revert InvalidExpiry();
        if (bytes(_metadataURI).length > 500) revert MetadataTooLong();

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(_to, tokenId);

        // Gas-efficient storage
        tokenOwner[tokenId] = _to;
        mintedAt[tokenId] = block.timestamp;
        tokenMetadata[tokenId] = _metadataURI;
        userMembershipCount[_to]++;
        membershipExpiry[_to] = _expiry;

        totalMinted++;

        // Transfer payment to treasury
        if (msg.value > 0) {
            payable(treasury).transfer(msg.value);
        }

        emit MembershipMinted(tokenId, _to, msg.value, block.timestamp);
        return tokenId;
    }

    /**
     * @notice Admin mint without payment
     * @param _to Address to mint the pass to
     * @param _metadataURI Metadata URI for the pass
     * @param _expiry Expiry timestamp (0 for permanent)
     * @return tokenId The ID of the minted pass
     */
    function adminMint(
        address _to,
        string memory _metadataURI,
        uint256 _expiry
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        if (_to == address(0)) revert ZeroAddress();
        if (maxSupply > 0 && totalMinted >= maxSupply) revert MaxSupplyReached();
        if (_expiry != 0 && _expiry <= block.timestamp) revert InvalidExpiry();
        if (bytes(_metadataURI).length > 500) revert MetadataTooLong();

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(_to, tokenId);

        tokenOwner[tokenId] = _to;
        mintedAt[tokenId] = block.timestamp;
        tokenMetadata[tokenId] = _metadataURI;
        userMembershipCount[_to]++;
        membershipExpiry[_to] = _expiry;

        totalMinted++;

        emit MembershipMinted(tokenId, _to, 0, block.timestamp);
        return tokenId;
    }

    /**
     * @notice Burn a membership pass
     * @param _tokenId Token ID to burn
     */
    function burnMembership(uint256 _tokenId) external nonReentrant {
        // This will revert with ERC721NonexistentToken if token does not exist
        address owner = ownerOf(_tokenId);
        
        if (!_isApprovedOrOwner(msg.sender, _tokenId)) revert NotTokenOwner();

        // Let _update handle the state changes for burning
        _burn(_tokenId);

        emit MembershipBurned(_tokenId, owner, block.timestamp);
    }

    /**
     * @notice Check if an address has a valid membership
     * @param _member Address to check
     * @return isValid Whether the membership is valid
     */
    function hasValidMembership(address _member) external view returns (bool) {
        if (userMembershipCount[_member] == 0) return false;
        
        uint256 expiry = membershipExpiry[_member];
        if (expiry == 0) return true; // Permanent membership
        
        return block.timestamp < expiry;
    }

    /**
     * @notice Get membership expiry for an address
     * @param _member Address to check
     * @return expiry Expiry timestamp (0 for permanent)
     */
    function getMembershipExpiry(address _member) external view returns (uint256) {
        return membershipExpiry[_member];
    }

    /**
     * @notice Extend membership expiry
     * @param _member Address to extend membership for
     * @param _newExpiry New expiry timestamp
     */
    function extendMembership(address _member, uint256 _newExpiry) external onlyRole(ADMIN_ROLE) {
        if (_member == address(0)) revert ZeroAddress();
        if (_newExpiry != 0 && _newExpiry <= block.timestamp) revert InvalidExpiry();
        if (userMembershipCount[_member] == 0) revert NotTokenOwner();

        membershipExpiry[_member] = _newExpiry;

        emit MembershipExtended(0, _member, _newExpiry, block.timestamp);
    }

    /**
     * @notice Update membership price
     * @param _newPrice New membership price
     */
    function setMembershipPrice(uint256 _newPrice) external onlyRole(ADMIN_ROLE) {
        membershipPrice = _newPrice;
        emit MembershipPriceUpdated(_newPrice, block.timestamp);
    }

    /**
     * @notice Update treasury address
     * @param _newTreasury New treasury address
     */
    function setTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        if (_newTreasury == address(0)) revert ZeroAddress();
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury, block.timestamp);
    }

    /**
     * @notice Update max supply
     * @param _newMaxSupply New max supply (0 for unlimited)
     */
    function setMaxSupply(uint256 _newMaxSupply) external onlyRole(ADMIN_ROLE) {
        if (_newMaxSupply != 0 && _newMaxSupply < totalMinted) revert MaxSupplyReached();
        maxSupply = _newMaxSupply;
        emit MaxSupplyUpdated(_newMaxSupply, block.timestamp);
    }

    /**
     * @notice Get token metadata
     * @param _tokenId Token ID
     * @return metadataURI Metadata URI
     */
    function getTokenMetadata(uint256 _tokenId) external view returns (string memory) {
        if (_ownerOf(_tokenId) == address(0)) revert InvalidTokenId();
        return tokenMetadata[_tokenId];
    }

    /**
     * @notice Get user's membership count
     * @param _user User address
     * @return count Number of memberships
     */
    function getUserMembershipCount(address _user) external view returns (uint256) {
        return userMembershipCount[_user];
    }

    /**
     * @notice Get token mint timestamp
     * @param _tokenId Token ID
     * @return timestamp Mint timestamp
     */
    function getTokenMintedAt(uint256 _tokenId) external view returns (uint256) {
        if (_ownerOf(_tokenId) == address(0)) revert InvalidTokenId();
        return mintedAt[_tokenId];
    }

    /**
     * @notice Check if token is burnable
     * @param _tokenId Token ID
     * @return isBurnable Whether the token can be burned
     */
    function isTokenBurnable(uint256 _tokenId) external view returns (bool) {
        if (_ownerOf(_tokenId) == address(0)) return false;
        return true; // All tokens are burnable in this implementation
    }

    /**
     * @notice Get contract statistics
     * @return minted Total minted
     * @return burned Total burned
     * @return supply Current supply
     * @return maxSupplyValue Maximum supply
     */
    function getStats() external view returns (
        uint256 minted,
        uint256 burned,
        uint256 supply,
        uint256 maxSupplyValue
    ) {
        return (totalMinted, totalBurned, totalSupply(), maxSupply);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Check if address has any membership
     * @param _member Address to check
     * @return hasMembership Whether the address has membership
     */
    function hasMembership(address _member) external view returns (bool) {
        return userMembershipCount[_member] > 0;
    }

    // Required overrides

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) {
            // Transfer: update user counts
            userMembershipCount[from]--;
            userMembershipCount[to]++;
            
            // Transfer expiry if exists
            if (membershipExpiry[from] != 0) {
                membershipExpiry[to] = membershipExpiry[from];
                delete membershipExpiry[from];
            }
        } else if (from != address(0) && to == address(0)) {
            // Burn: update storage
            delete tokenOwner[tokenId];
            delete mintedAt[tokenId];
            delete tokenMetadata[tokenId];
            userMembershipCount[from]--;
            delete membershipExpiry[from];
            totalBurned++;
        }
        
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Internal helper

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        return _isAuthorized(ownerOf(tokenId), spender, tokenId);
    }
}