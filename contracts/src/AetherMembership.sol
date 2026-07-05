// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AetherMembership
 * @notice ERC721 membership NFT contract for Aether platform
 * @dev Manages membership NFTs for community access
 */
contract AetherMembership is
    ERC721,
    ERC721Enumerable,
    AccessControl,
    ReentrancyGuard
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public membershipPrice;
    uint256 private _tokenIdCounter;

    address public treasury;

    struct Membership {
        uint256 tokenId;
        address member;
        uint256 joinedAt;
        string metadataURI;
    }

    mapping(uint256 => Membership) public memberships;
    mapping(address => uint256[]) public userMemberships;

    event MembershipMinted(
        uint256 indexed tokenId,
        address indexed member,
        uint256 price
    );
    event MembershipPriceUpdated(uint256 newPrice);
    event TreasuryUpdated(address newTreasury);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _membershipPrice
    ) ERC721(_name, _symbol) {
        membershipPrice = _membershipPrice;
        treasury = msg.sender;
        _tokenIdCounter = 1;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintMembership(address _to, string memory _metadataURI)
        external
        payable
        nonReentrant
        returns (uint256)
    {
        require(msg.value >= membershipPrice, "Insufficient payment");
        require(_to != address(0), "Invalid address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);

        memberships[tokenId] = Membership({
            tokenId: tokenId,
            member: _to,
            joinedAt: block.timestamp,
            metadataURI: _metadataURI
        });

        userMemberships[_to].push(tokenId);

        // Transfer payment to treasury
        if (msg.value > 0) {
            payable(treasury).transfer(msg.value);
        }

        emit MembershipMinted(tokenId, _to, msg.value);
        return tokenId;
    }

    function adminMint(address _to, string memory _metadataURI)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
        returns (uint256)
    {
        require(_to != address(0), "Invalid address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);

        memberships[tokenId] = Membership({
            tokenId: tokenId,
            member: _to,
            joinedAt: block.timestamp,
            metadataURI: _metadataURI
        });

        userMemberships[_to].push(tokenId);

        emit MembershipMinted(tokenId, _to, 0);
        return tokenId;
    }

    function setMembershipPrice(uint256 _newPrice) external onlyRole(ADMIN_ROLE) {
        membershipPrice = _newPrice;
        emit MembershipPriceUpdated(_newPrice);
    }

    function setTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    function getUserMemberships(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userMemberships[_user];
    }

    function getMembership(uint256 _tokenId)
        external
        view
        returns (uint256 tokenId, address member, uint256 joinedAt, string memory metadataURI)
    {
        Membership memory membership = memberships[_tokenId];
        return (membership.tokenId, membership.member, membership.joinedAt, membership.metadataURI);
    }

    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return super.totalSupply();
    }

    function tokenOfOwnerByIndex(address owner, uint256 index)
        public
        view
        override(ERC721Enumerable)
        returns (uint256)
    {
        return super.tokenOfOwnerByIndex(owner, index);
    }

    function tokenByIndex(uint256 index)
        public
        view
        override(ERC721Enumerable)
        returns (uint256)
    {
        return super.tokenByIndex(index);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
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
}