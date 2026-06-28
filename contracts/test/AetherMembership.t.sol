// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AetherMembership.sol";

/**
 * @title AetherMembershipTest
 * @notice Test suite for AetherMembership contract
 */
contract AetherMembershipTest is Test {
    AetherMembership public membership;
    address public admin;
    address public minter;
    address public user1;
    address public user2;

    uint256 constant MEMBERSHIP_PRICE = 0.01 ether;
    string constant NAME = "Aether Membership";
    string constant SYMBOL = "AETH";

    function setUp() public {
        admin = address(this);
        minter = address(0x1);
        user1 = address(0x2);
        user2 = address(0x3);

        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        membership = new AetherMembership(NAME, SYMBOL, MEMBERSHIP_PRICE);
        membership.grantRole(membership.MINTER_ROLE(), minter);
    }

    function test_InitialState() public view {
        assertEq(membership.name(), NAME);
        assertEq(membership.symbol(), SYMBOL);
        assertEq(membership.membershipPrice(), MEMBERSHIP_PRICE);
        assertEq(membership.treasury(), admin);
        assertEq(membership.totalSupply(), 0);
    }

    function test_MintMembership() public {
        vm.startPrank(user1);
        
        uint256 tokenId = membership.mintMembership(user1, "ipfs://metadata");
        
        assertEq(membership.ownerOf(tokenId), user1);
        assertEq(membership.totalSupply(), 1);
        
        (, , uint256 joinedAt, ) = membership.getMembership(tokenId);
        assertGt(joinedAt, 0);
        
        vm.stopPrank();
    }

    function test_MintMembership_InsufficientPayment() public {
        vm.startPrank(user1);
        
        vm.expectRevert("Insufficient payment");
        membership.mintMembership{value: 0.001 ether}(user1, "ipfs://metadata");
        
        vm.stopPrank();
    }

    function test_AdminMint() public {
        vm.startPrank(minter);
        
        uint256 tokenId = membership.adminMint(user1, "ipfs://metadata");
        
        assertEq(membership.ownerOf(tokenId), user1);
        assertEq(membership.totalSupply(), 1);
        
        vm.stopPrank();
    }

    function test_AdminMint_Unauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        membership.adminMint(user1, "ipfs://metadata");
        
        vm.stopPrank();
    }

    function test_SetMembershipPrice() public {
        uint256 newPrice = 0.02 ether;
        
        membership.setMembershipPrice(newPrice);
        
        assertEq(membership.membershipPrice(), newPrice);
    }

    function test_SetMembershipPrice_Unauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        membership.setMembershipPrice(0.02 ether);
        
        vm.stopPrank();
    }

    function test_SetTreasury() public {
        address newTreasury = address(0x4);
        
        membership.setTreasury(newTreasury);
        
        assertEq(membership.treasury(), newTreasury);
    }

    function test_GetUserMemberships() public {
        vm.startPrank(user1);
        
        membership.mintMembership{value: MEMBERSHIP_PRICE}(user1, "ipfs://1");
        membership.mintMembership{value: MEMBERSHIP_PRICE}(user1, "ipfs://2");
        
        uint256[] memory userMemberships = membership.getUserMemberships(user1);
        assertEq(userMemberships.length, 2);
        
        vm.stopPrank();
    }

    function test_TransferMembership() public {
        vm.startPrank(user1);
        
        uint256 tokenId = membership.mintMembership{value: MEMBERSHIP_PRICE}(user1, "ipfs://metadata");
        membership.transferFrom(user1, user2, tokenId);
        
        assertEq(membership.ownerOf(tokenId), user2);
        
        vm.stopPrank();
    }
}