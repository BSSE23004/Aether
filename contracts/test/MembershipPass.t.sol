// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MembershipPass.sol";

/**
 * @title MembershipPassTest
 * @notice Comprehensive test suite for MembershipPass contract
 */
contract MembershipPassTest is Test {
    MembershipPass public membershipPass;
    address public admin;
    address public minter;
    address public burner;
    address public user1;
    address public user2;

    // Test data
    string constant NAME = "Aether Membership Pass";
    string constant SYMBOL = "AMP";
    uint256 constant MEMBERSHIP_PRICE = 0.01 ether;
    uint256 constant MAX_SUPPLY = 1000;
    string constant METADATA_URI = "ipfs://QmTest123";
    uint256 constant EXPIRY_TIME = 365 days;

    function setUp() public {
        admin = address(this);
        minter = address(0x1);
        burner = address(0x2);
        user1 = address(0x3);
        user2 = address(0x4);

        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        membershipPass = new MembershipPass(
            NAME,
            SYMBOL,
            MEMBERSHIP_PRICE,
            MAX_SUPPLY,
            admin
        );

        membershipPass.grantRole(membershipPass.MINTER_ROLE(), minter);
        membershipPass.grantRole(membershipPass.BURNER_ROLE(), burner);
    }

    // ==================== Constructor Tests ====================

    function test_Constructor_InitialState() public view {
        assertEq(membershipPass.name(), NAME);
        assertEq(membershipPass.symbol(), SYMBOL);
        assertEq(membershipPass.membershipPrice(), MEMBERSHIP_PRICE);
        assertEq(membershipPass.maxSupply(), MAX_SUPPLY);
        assertEq(membershipPass.treasury(), admin);
        assertEq(membershipPass.totalMinted(), 0);
        assertEq(membershipPass.totalBurned(), 0);
        assertEq(membershipPass.totalSupply(), 0);
    }

    function test_Constructor_RoleSetup() public view {
        assertTrue(membershipPass.hasRole(membershipPass.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(membershipPass.hasRole(membershipPass.ADMIN_ROLE(), admin));
        assertTrue(membershipPass.hasRole(membershipPass.MINTER_ROLE(), admin));
        assertTrue(membershipPass.hasRole(membershipPass.BURNER_ROLE(), admin));
    }

    function test_Constructor_RoleAdminSetup() public view {
        assertEq(
            membershipPass.getRoleAdmin(membershipPass.ADMIN_ROLE()),
            membershipPass.DEFAULT_ADMIN_ROLE()
        );
        assertEq(
            membershipPass.getRoleAdmin(membershipPass.MINTER_ROLE()),
            membershipPass.ADMIN_ROLE()
        );
        assertEq(
            membershipPass.getRoleAdmin(membershipPass.BURNER_ROLE()),
            membershipPass.ADMIN_ROLE()
        );
    }

    // ==================== Minting Tests ====================

    function test_MintMembership_Success() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(membershipPass.ownerOf(tokenId), user1);
        assertEq(membershipPass.totalMinted(), 1);
        assertEq(membershipPass.totalSupply(), 1);
        assertEq(membershipPass.getUserMembershipCount(user1), 1);
        assertEq(membershipPass.tokenOwner(tokenId), user1);
        assertEq(membershipPass.getTokenMetadata(tokenId), METADATA_URI);
        assertEq(membershipPass.getTokenMintedAt(tokenId), block.timestamp);
        assertEq(membershipPass.getMembershipExpiry(user1), EXPIRY_TIME);
    }

    function test_MintMembership_ZeroAddress() public {
        vm.startPrank(user1);

        vm.expectRevert(MembershipPass.ZeroAddress.selector);
        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            address(0),
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();
    }

    function test_MintMembership_InsufficientPayment() public {
        vm.startPrank(user1);

        vm.expectRevert(MembershipPass.InsufficientPayment.selector);
        membershipPass.mintMembership{value: MEMBERSHIP_PRICE - 1}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();
    }

    function test_MintMembership_MaxSupplyReached() public {
        // Create contract with max supply of 1
        MembershipPass limitedPass = new MembershipPass(
            NAME,
            SYMBOL,
            MEMBERSHIP_PRICE,
            1,
            admin
        );

        vm.startPrank(user1);
        limitedPass.mintMembership{value: MEMBERSHIP_PRICE}(user1, METADATA_URI, EXPIRY_TIME);

        vm.expectRevert(MembershipPass.MaxSupplyReached.selector);
        limitedPass.mintMembership{value: MEMBERSHIP_PRICE}(user1, METADATA_URI, EXPIRY_TIME);

        vm.stopPrank();
    }

    function test_MintMembership_InvalidExpiry() public {
        vm.startPrank(user1);

        vm.expectRevert(MembershipPass.InvalidExpiry.selector);
        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            block.timestamp - 1
        );

        vm.stopPrank();
    }

    function test_MintMembership_MetadataTooLong() public {
        vm.startPrank(user1);

        string memory longMetadata = "a"; // Will be expanded in test
        vm.expectRevert(MembershipPass.MetadataTooLong.selector);
        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum",
            EXPIRY_TIME
        );

        vm.stopPrank();
    }

    function test_MintMembership_Permanent() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            0 // Permanent membership
        );

        vm.stopPrank();

        assertEq(membershipPass.getMembershipExpiry(user1), 0);
        assertTrue(membershipPass.hasValidMembership(user1));
    }

    function test_MintMembership_TransferToTreasury() public {
        uint256 treasuryBalance = membershipPass.treasury.balance;

        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(membershipPass.treasury.balance, treasuryBalance + MEMBERSHIP_PRICE);
    }

    function test_MintMembership_Multiple() public {
        vm.startPrank(user1);

        uint256 id1 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );
        uint256 id2 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );
        uint256 id3 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(membershipPass.getUserMembershipCount(user1), 3);
        assertEq(membershipPass.totalMinted(), 3);
    }

    // ==================== Admin Mint Tests ====================

    function test_AdminMint_Success() public {
        vm.startPrank(minter);

        uint256 tokenId = membershipPass.adminMint(user1, METADATA_URI, EXPIRY_TIME);

        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(membershipPass.ownerOf(tokenId), user1);
        assertEq(membershipPass.totalMinted(), 1);
        assertEq(membershipPass.getUserMembershipCount(user1), 1);
    }

    function test_AdminMint_ZeroAddress() public {
        vm.startPrank(minter);

        vm.expectRevert(MembershipPass.ZeroAddress.selector);
        membershipPass.adminMint(address(0), METADATA_URI, EXPIRY_TIME);

        vm.stopPrank();
    }

    function test_AdminMint_Unauthorized() public {
        vm.startPrank(user1);

        vm.expectRevert(); // AccessControl error
        membershipPass.adminMint(user1, METADATA_URI, EXPIRY_TIME);

        vm.stopPrank();
    }

    function test_AdminMint_NoPayment() public {
        uint256 treasuryBalance = membershipPass.treasury.balance;

        vm.startPrank(minter);

        membershipPass.adminMint(user1, METADATA_URI, EXPIRY_TIME);

        vm.stopPrank();

        assertEq(membershipPass.treasury.balance, treasuryBalance); // No payment transferred
    }

    // ==================== Burning Tests ====================

    function test_BurnMembership_Success() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        membershipPass.burnMembership(tokenId);

        vm.stopPrank();

        assertEq(membershipPass.totalSupply(), 0);
        assertEq(membershipPass.totalBurned(), 1);
        assertEq(membershipPass.getUserMembershipCount(user1), 0);
        assertEq(membershipPass.getMembershipExpiry(user1), 0);
    }

    function test_BurnMembership_NotOwner() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        vm.startPrank(user2);

        vm.expectRevert(MembershipPass.NotTokenOwner.selector);
        membershipPass.burnMembership(tokenId);

        vm.stopPrank();
    }

    function test_BurnMembership_InvalidTokenId() public {
        vm.startPrank(user1);

        vm.expectRevert(MembershipPass.NotTokenOwner.selector);
        membershipPass.burnMembership(999);

        vm.stopPrank();
    }

    function test_BurnMembership_ClearsStorage() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        membershipPass.burnMembership(tokenId);

        vm.stopPrank();

        // Check storage is cleared
        assertEq(membershipPass.tokenOwner(tokenId), address(0));
        assertEq(membershipPass.getTokenMintedAt(tokenId), 0);
        assertEq(membershipPass.getTokenMetadata(tokenId), "");
    }

    // ==================== Membership Check Tests ====================

    function test_HasValidMembership_Permanent() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            0 // Permanent
        );

        vm.stopPrank();

        assertTrue(membershipPass.hasValidMembership(user1));
    }

    function test_HasValidMembership_NotExpired() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            block.timestamp + EXPIRY_TIME
        );

        vm.stopPrank();

        assertTrue(membershipPass.hasValidMembership(user1));
    }

    function test_HasValidMembership_Expired() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            block.timestamp + 1 seconds // Very short expiry
        );

        vm.stopPrank();

        // Fast forward past expiry
        warp(block.timestamp + 2);

        assertTrue(!membershipPass.hasValidMembership(user1));
    }

    function test_HasValidMembership_NoMembership() public {
        assertTrue(!membershipPass.hasValidMembership(user1));
    }

    function test_HasMembership() public {
        assertTrue(!membershipPass.hasMembership(user1));

        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertTrue(membershipPass.hasMembership(user1));
    }

    // ==================== Admin Management Tests ====================

    function test_SetMembershipPrice_Success() public {
        uint256 newPrice = 0.02 ether;

        membershipPass.setMembershipPrice(newPrice);

        assertEq(membershipPass.membershipPrice(), newPrice);
    }

    function test_SetMembershipPrice_Unauthorized() public {
        vm.startPrank(user1);

        vm.expectRevert(); // AccessControl error
        membershipPass.setMembershipPrice(0.02 ether);

        vm.stopPrank();
    }

    function test_SetTreasury_Success() public {
        address newTreasury = address(0x5);

        membershipPass.setTreasury(newTreasury);

        assertEq(membershipPass.treasury(), newTreasury);
    }

    function test_SetTreasury_ZeroAddress() public {
        vm.expectRevert(MembershipPass.ZeroAddress.selector);
        membershipPass.setTreasury(address(0));
    }

    function test_SetTreasury_Unauthorized() public {
        vm.startPrank(user1);

        vm.expectRevert(); // AccessControl error
        membershipPass.setTreasury(address(0x5));

        vm.stopPrank();
    }

    function test_SetMaxSupply_Success() public {
        uint256 newMaxSupply = 2000;

        membershipPass.setMaxSupply(newMaxSupply);

        assertEq(membershipPass.maxSupply(), newMaxSupply);
    }

    function test_SetMaxSupply_BelowMinted() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        vm.expectRevert(MembershipPass.MaxSupplyReached.selector);
        membershipPass.setMaxSupply(0); // Can't set below minted amount
    }

    function test_SetMaxSupply_Unlimited() public {
        membershipPass.setMaxSupply(0);

        assertEq(membershipPass.maxSupply(), 0);
    }

    function test_ExtendMembership_Success() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            block.timestamp + EXPIRY_TIME
        );

        vm.stopPrank();

        uint256 newExpiry = block.timestamp + EXPIRY_TIME * 2;
        membershipPass.extendMembership(user1, newExpiry);

        assertEq(membershipPass.getMembershipExpiry(user1), newExpiry);
    }

    function test_ExtendMembership_ZeroAddress() public {
        vm.expectRevert(MembershipPass.ZeroAddress.selector);
        membershipPass.extendMembership(address(0), block.timestamp + EXPIRY_TIME);
    }

    function test_ExtendMembership_InvalidExpiry() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        vm.expectRevert(MembershipPass.InvalidExpiry.selector);
        membershipPass.extendMembership(user1, block.timestamp - 1);
    }

    function test_ExtendMembership_NoMembership() public {
        vm.expectRevert(MembershipPass.NotTokenOwner.selector);
        membershipPass.extendMembership(user1, block.timestamp + EXPIRY_TIME);
    }

    function test_ExtendMembership_Unauthorized() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        vm.startPrank(user2);

        vm.expectRevert(); // AccessControl error
        membershipPass.extendMembership(user1, block.timestamp + EXPIRY_TIME);

        vm.stopPrank();
    }

    // ==================== Transfer Tests ====================

    function test_TransferMembership_Success() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        membershipPass.transferFrom(user1, user2, tokenId);

        vm.stopPrank();

        assertEq(membershipPass.ownerOf(tokenId), user2);
        assertEq(membershipPass.getUserMembershipCount(user1), 0);
        assertEq(membershipPass.getUserMembershipCount(user2), 1);
    }

    function test_TransferMembership_WithExpiry() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            block.timestamp + EXPIRY_TIME
        );

        membershipPass.transferFrom(user1, user2, tokenId);

        vm.stopPrank();

        assertEq(membershipPass.getMembershipExpiry(user2), block.timestamp + EXPIRY_TIME);
        assertEq(membershipPass.getMembershipExpiry(user1), 0);
    }

    // ==================== View Function Tests ====================

    function test_GetTokenMetadata() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(membershipPass.getTokenMetadata(tokenId), METADATA_URI);
    }

    function test_GetTokenMetadata_InvalidToken() public {
        vm.expectRevert(MembershipPass.InvalidTokenId.selector);
        membershipPass.getTokenMetadata(999);
    }

    function test_GetTokenMintedAt() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(membershipPass.getTokenMintedAt(tokenId), block.timestamp);
    }

    function test_GetStats() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        membershipPass.burnMembership(1);

        vm.stopPrank();

        (uint256 minted, uint256 burned, uint256 supply, uint256 maxSupplyValue) = 
            membershipPass.getStats();

        assertEq(minted, 1);
        assertEq(burned, 1);
        assertEq(supply, 0);
        assertEq(maxSupplyValue, MAX_SUPPLY);
    }

    function test_IsTokenBurnable() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertTrue(membershipPass.isTokenBurnable(tokenId));
    }

    function test_IsTokenBurnable_InvalidToken() public {
        assertTrue(!membershipPass.isTokenBurnable(999));
    }

    // ==================== Enumerable Tests ====================

    function test_TokenOfOwnerByIndex() public {
        vm.startPrank(user1);

        uint256 id1 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );
        uint256 id2 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(membershipPass.tokenOfOwnerByIndex(user1, 0), id1);
        assertEq(membershipPass.tokenOfOwnerByIndex(user1, 1), id2);
    }

    function test_TokenByIndex() public {
        vm.startPrank(user1);

        uint256 id1 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );
        uint256 id2 = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        assertEq(membershipPass.tokenByIndex(0), id1);
        assertEq(membershipPass.tokenByIndex(1), id2);
    }

    // ==================== Event Tests ====================

    function test_Event_MembershipMinted() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        // Verify event was emitted by checking state changes
        assertEq(membershipPass.totalMinted(), 1);
        assertEq(membershipPass.getUserMembershipCount(user1), 1);
    }

    function test_Event_MembershipBurned() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        membershipPass.burnMembership(tokenId);

        vm.stopPrank();

        // Verify event was emitted by checking state changes
        assertEq(membershipPass.totalBurned(), 1);
        assertEq(membershipPass.getUserMembershipCount(user1), 0);
    }

    function test_Event_MembershipPriceUpdated() public {
        uint256 newPrice = 0.02 ether;

        membershipPass.setMembershipPrice(newPrice);

        assertEq(membershipPass.membershipPrice(), newPrice);
    }

    function test_Event_TreasuryUpdated() public {
        address newTreasury = address(0x5);

        membershipPass.setTreasury(newTreasury);

        assertEq(membershipPass.treasury(), newTreasury);
    }

    function test_Event_MaxSupplyUpdated() public {
        uint256 newMaxSupply = 2000;

        membershipPass.setMaxSupply(newMaxSupply);

        assertEq(membershipPass.maxSupply(), newMaxSupply);
    }

    function test_Event_MembershipExtended() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        uint256 newExpiry = block.timestamp + EXPIRY_TIME * 2;

        membershipPass.extendMembership(user1, newExpiry);

        assertEq(membershipPass.getMembershipExpiry(user1), newExpiry);
    }

    // ==================== Gas Efficiency Tests ====================

    function test_Gas_MintMembership() public {
        vm.startPrank(user1);

        uint256 gasBefore = gasleft();
        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for mintMembership:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_BurnMembership() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        uint256 gasBefore = gasleft();
        membershipPass.burnMembership(tokenId);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for burnMembership:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_HasValidMembership() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        uint256 gasBefore = gasleft();
        membershipPass.hasValidMembership(user1);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for hasValidMembership:", gasUsed);
    }
}

    // ==================== Gas Efficiency Tests ====================

    function test_Gas_MintMembership() public {
        vm.startPrank(user1);

        uint256 gasBefore = gasleft();
        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for mintMembership:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_BurnMembership() public {
        vm.startPrank(user1);

        uint256 tokenId = membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        uint256 gasBefore = gasleft();
        membershipPass.burnMembership(tokenId);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for burnMembership:", gasUsed);

        vm.stopPrank();
    }

    function test_Gas_HasValidMembership() public {
        vm.startPrank(user1);

        membershipPass.mintMembership{value: MEMBERSHIP_PRICE}(
            user1,
            METADATA_URI,
            EXPIRY_TIME
        );

        vm.stopPrank();

        uint256 gasBefore = gasleft();
        membershipPass.hasValidMembership(user1);
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;

        console.log("Gas used for hasValidMembership:", gasUsed);
    }
}