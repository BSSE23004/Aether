// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AetherCommunity.sol";
import "../src/AetherMembership.sol";

/**
 * @title AetherCommunityTest
 * @notice Test suite for AetherCommunity contract
 */
contract AetherCommunityTest is Test {
    AetherCommunity public community;
    AetherMembership public membership;
    address public admin;
    address public user1;
    address public user2;

    string constant NAME = "Aether";
    string constant DESCRIPTION = "Aether Platform";

    function setUp() public {
        admin = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        membership = new AetherMembership("Aether Membership", "AETH", 0.01 ether);
        community = new AetherCommunity(
            address(membership),
            address(0x0), // Governance address placeholder
            NAME,
            DESCRIPTION
        );
    }

    function test_InitialState() public view {
        assertEq(community.name(), NAME);
        assertEq(community.description(), DESCRIPTION);
        assertEq(community.totalCommunities(), 0);
    }

    function test_CreateCommunity() public {
        vm.startPrank(user1);
        
        uint256 communityId = community.createCommunity("Test Community", "Test Description");
        
        assertEq(communityId, 1);
        assertEq(community.totalCommunities(), 1);
        
        (string memory name, string memory description, address creator, , bool isActive) = community.getCommunity(communityId);
        assertEq(name, "Test Community");
        assertEq(description, "Test Description");
        assertEq(creator, user1);
        assertTrue(isActive);
        
        vm.stopPrank();
    }

    function test_CreateCommunity_Multiple() public {
        vm.startPrank(user1);
        
        community.createCommunity("Community 1", "Description 1");
        community.createCommunity("Community 2", "Description 2");
        
        assertEq(community.totalCommunities(), 2);
        
        vm.stopPrank();
    }

    function test_UpdateCommunity() public {
        vm.startPrank(user1);
        
        uint256 communityId = community.createCommunity("Original Name", "Original Description");
        
        vm.stopPrank();
        
        community.updateCommunity(communityId, "Updated Name", "Updated Description");
        
        (string memory name, string memory description, , , ) = community.getCommunity(communityId);
        assertEq(name, "Updated Name");
        assertEq(description, "Updated Description");
    }

    function test_UpdateCommunity_Unauthorized() public {
        vm.startPrank(user1);
        
        uint256 communityId = community.createCommunity("Original Name", "Original Description");
        
        vm.stopPrank();
        
        vm.startPrank(user2);
        
        vm.expectRevert();
        community.updateCommunity(communityId, "Updated Name", "Updated Description");
        
        vm.stopPrank();
    }

    function test_DeactivateCommunity() public {
        vm.startPrank(user1);
        
        uint256 communityId = community.createCommunity("Test Community", "Test Description");
        
        vm.stopPrank();
        
        community.deactivateCommunity(communityId);
        
        (, , , , bool isActive) = community.getCommunity(communityId);
        assertTrue(!isActive);
    }

    function test_DeactivateCommunity_Unauthorized() public {
        vm.startPrank(user1);
        
        uint256 communityId = community.createCommunity("Test Community", "Test Description");
        
        vm.stopPrank();
        
        vm.startPrank(user2);
        
        vm.expectRevert();
        community.deactivateCommunity(communityId);
        
        vm.stopPrank();
    }

    function test_GetUserCommunities() public {
        vm.startPrank(user1);
        
        community.createCommunity("Community 1", "Description 1");
        community.createCommunity("Community 2", "Description 2");
        
        uint256[] memory userCommunities = community.getUserCommunities(user1);
        assertEq(userCommunities.length, 2);
        assertEq(userCommunities[0], 1);
        assertEq(userCommunities[1], 2);
        
        vm.stopPrank();
    }
}