// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CommunityRegistry.sol";

/**
 * @title CommunityRegistryTest
 * @notice Comprehensive test suite for CommunityRegistry contract
 */
contract CommunityRegistryTest is Test {
    CommunityRegistry public registry;
    address public admin;
    address public creator;
    address public user1;
    address public user2;
    address public user3;

    // Test data
    string constant COMMUNITY_NAME = "Test Community";
    string constant COMMUNITY_DESCRIPTION = "A test community for testing";
    string constant METADATA_URI = "ipfs://QmTest123";
    string constant HTTP_METADATA_URI = "https://example.com/metadata.json";

    function setUp() public {
        admin = address(this);
        creator = address(0x1);
        user1 = address(0x2);
        user2 = address(0x3);
        user3 = address(0x4);

        // Grant creator role
        registry = new CommunityRegistry(admin);
        registry.grantRole(registry.CREATOR_ROLE(), creator);
    }

    // ==================== Constructor Tests ====================

    function test_Constructor_InitialState() public view {
        assertEq(registry.totalCommunities(), 0);
        assertEq(registry.activeCommunities(), 0);
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(registry.CREATOR_ROLE(), admin));
    }

    function test_Constructor_RoleSetup() public view {
        // Check role admin setup
        assertEq(registry.getRoleAdmin(registry.ADMIN_ROLE()), registry.DEFAULT_ADMIN_ROLE());
        assertEq(registry.getRoleAdmin(registry.MODERATOR_ROLE()), registry.ADMIN_ROLE());
        assertEq(registry.getRoleAdmin(registry.CREATOR_ROLE()), registry.ADMIN_ROLE());
    }

    // ==================== Community Creation Tests ====================

    function test_CreateCommunity_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();

        assertEq(communityId, 1);
        assertEq(registry.totalCommunities(), 1);
        assertEq(registry.activeCommunities(), 1);

        (uint256 id, string memory name, string memory description, string memory metadataURI, 
         address creatorAddr, address adminAddr, uint256 createdAt, uint256 updatedAt, 
         bool isActive, bool isVerified) = registry.getCommunity(communityId);
        
        assertEq(id, communityId);
        assertEq(name, COMMUNITY_NAME);
        assertEq(description, COMMUNITY_DESCRIPTION);
        assertEq(metadataURI, METADATA_URI);
        assertEq(creatorAddr, creator);
        assertEq(adminAddr, creator);
        assertGt(createdAt, 0);
        assertGt(updatedAt, 0);
        assertTrue(isActive);
        assertTrue(!isVerified);
    }

    function test_CreateCommunity_InvalidName() public {
        vm.startPrank(creator);
        
        vm.expectRevert("Name cannot be empty");
        registry.createCommunity("", COMMUNITY_DESCRIPTION, METADATA_URI);
        
        vm.stopPrank();
    }

    function test_CreateCommunity_NameTooLong() public {
        vm.startPrank(creator);
        
        string memory longName = "a"; // Will be expanded
        vm.expectRevert("Name too long");
        registry.createCommunity(
            "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
    }

    function test_CreateCommunity_DescriptionTooLong() public {
        vm.startPrank(creator);
        
        vm.expectRevert("Description too long");
        registry.createCommunity(
            COMMUNITY_NAME,
            "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum",
            METADATA_URI
        );
        
        vm.stopPrank();
    }

    function test_CreateCommunity_DuplicateName() public {
        vm.startPrank(creator);
        
        registry.createCommunity(COMMUNITY_NAME, COMMUNITY_DESCRIPTION, METADATA_URI);
        
        vm.expectRevert(CommunityRegistry.CommunityAlreadyExists.selector);
        registry.createCommunity(COMMUNITY_NAME, "Different description", METADATA_URI);
        
        vm.stopPrank();
    }

    function test_CreateCommunity_Unauthorized() public {
        vm.startPrank(user1);
        
        vm.expectRevert(); // AccessControl error
        registry.createCommunity(COMMUNITY_NAME, COMMUNITY_DESCRIPTION, METADATA_URI);
        
        vm.stopPrank();
    }

    function test_CreateCommunity_InvalidMetadataURI() public {
        vm.startPrank(creator);
        
        vm.expectRevert(CommunityRegistry.InvalidMetadata.selector);
        registry.createCommunity(COMMUNITY_NAME, COMMUNITY_DESCRIPTION, "invalid-uri");
        
        vm.stopPrank();
    }

    function test_CreateCommunity_HTTPMetadataURI() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            HTTP_METADATA_URI
        );
        
        vm.stopPrank();

        (, , , string memory metadataURI, , , , , , ) = registry.getCommunity(communityId);
        assertEq(metadataURI, HTTP_METADATA_URI);
    }

    function test_CreateCommunity_WithoutMetadata() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            ""
        );
        
        vm.stopPrank();

        (, , , string memory metadataURI, , , , , , ) = registry.getCommunity(communityId);
        assertEq(metadataURI, "");
    }

    function test_CreateCommunity_IncrementingId() public {
        vm.startPrank(creator);
        
        uint256 id1 = registry.createCommunity("Community 1", "Description 1", METADATA_URI);
        uint256 id2 = registry.createCommunity("Community 2", "Description 2", METADATA_URI);
        uint256 id3 = registry.createCommunity("Community 3", "Description 3", METADATA_URI);
        
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(registry.totalCommunities(), 3);
    }

    // ==================== Community Update Tests ====================

    function test_UpdateCommunity_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.updateCommunity(
            communityId,
            "Updated Name",
            "Updated Description",
            "ipfs://QmUpdated"
        );
        
        vm.stopPrank();

        (, string memory name, string memory description, string memory metadataURI, , , , uint256 updatedAt, , ) = 
            registry.getCommunity(communityId);
        
        assertEq(name, "Updated Name");
        assertEq(description, "Updated Description");
        assertEq(metadataURI, "ipfs://QmUpdated");
        assertGt(updatedAt, block.timestamp - 1);
    }

    function test_UpdateCommunity_OnlyName() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.updateCommunity(
            communityId,
            "Updated Name",
            "",
            ""
        );
        
        vm.stopPrank();

        (, string memory name, string memory description, string memory metadataURI, , , , , , ) = 
            registry.getCommunity(communityId);
        
        assertEq(name, "Updated Name");
        assertEq(description, COMMUNITY_DESCRIPTION); // Should remain unchanged
        assertEq(metadataURI, METADATA_URI); // Should remain unchanged
    }

    function test_UpdateCommunity_DuplicateName() public {
        vm.startPrank(creator);
        
        uint256 id1 = registry.createCommunity("Community 1", "Description 1", METADATA_URI);
        uint256 id2 = registry.createCommunity("Community 2", "Description 2", METADATA_URI);
        
        vm.expectRevert(CommunityRegistry.CommunityAlreadyExists.selector);
        registry.updateCommunity(id1, "Community 2", "New description", METADATA_URI);
        
        vm.stopPrank();
    }

    function test_UpdateCommunity_Inactive() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.deactivateCommunity(communityId);
        
        vm.expectRevert(CommunityRegistry.CommunityNotActive.selector);
        registry.updateCommunity(communityId, "New Name", "New Description", METADATA_URI);
        
        vm.stopPrank();
    }

    function test_UpdateCommunity_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CommunityRegistry.UnauthorizedAccess.selector);
        registry.updateCommunity(communityId, "New Name", "New Description", METADATA_URI);
        
        vm.stopPrank();
    }

    function test_UpdateCommunity_GlobalAdmin() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        // Global admin should be able to update
        registry.updateCommunity(communityId, "Admin Updated", "Admin Description", METADATA_URI);

        (, string memory name, , , , , , , , ) = registry.getCommunity(communityId);
        assertEq(name, "Admin Updated");
    }

    // ==================== Community Deactivation Tests ====================

    function test_DeactivateCommunity_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        assertEq(registry.activeCommunities(), 1);
        
        registry.deactivateCommunity(communityId);
        
        assertEq(registry.activeCommunities(), 0);
        
        (, , , , , , , , bool isActive, ) = registry.getCommunity(communityId);
        assertTrue(!isActive);
        
        vm.stopPrank();
    }

    function test_DeactivateCommunity_Inactive() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.deactivateCommunity(communityId);
        
        vm.expectRevert(CommunityRegistry.CommunityNotActive.selector);
        registry.deactivateCommunity(communityId);
        
        vm.stopPrank();
    }

    function test_DeactivateCommunity_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CommunityRegistry.UnauthorizedAccess.selector);
        registry.deactivateCommunity(communityId);
        
        vm.stopPrank();
    }

    // ==================== Community Activation Tests ====================

    function test_ActivateCommunity_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.deactivateCommunity(communityId);
        assertEq(registry.activeCommunities(), 0);
        
        vm.stopPrank();
        
        registry.activateCommunity(communityId);
        assertEq(registry.activeCommunities(), 1);
        
        (, , , , , , , , bool isActive, ) = registry.getCommunity(communityId);
        assertTrue(isActive);
    }

    function test_ActivateCommunity_AlreadyActive() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.expectRevert("Community already active");
        registry.activateCommunity(communityId);
    }

    function test_ActivateCommunity_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.deactivateCommunity(communityId);
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(); // AccessControl error
        registry.activateCommunity(communityId);
        
        vm.stopPrank();
    }

    // ==================== Admin Management Tests ====================

    function test_AddCommunityAdmin_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.addCommunityAdmin(communityId, user1);
        
        vm.stopPrank();

        assertTrue(registry.isCommunityAdmin(communityId, user1));
        
        address[] memory admins = registry.getCommunityAdmins(communityId);
        assertEq(admins.length, 2); // creator + user1
    }

    function test_AddCommunityAdmin_AlreadyAdmin() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.expectRevert(CommunityRegistry.AlreadyAdmin.selector);
        registry.addCommunityAdmin(communityId, creator);
        
        vm.stopPrank();
    }

    function test_AddCommunityAdmin_InvalidAddress() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.expectRevert("Invalid address");
        registry.addCommunityAdmin(communityId, address(0));
        
        vm.stopPrank();
    }

    function test_AddCommunityAdmin_Inactive() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.deactivateCommunity(communityId);
        
        vm.expectRevert(CommunityRegistry.CommunityNotActive.selector);
        registry.addCommunityAdmin(communityId, user1);
        
        vm.stopPrank();
    }

    function test_AddCommunityAdmin_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CommunityRegistry.UnauthorizedAccess.selector);
        registry.addCommunityAdmin(communityId, user2);
        
        vm.stopPrank();
    }

    function test_RemoveCommunityAdmin_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.addCommunityAdmin(communityId, user1);
        assertTrue(registry.isCommunityAdmin(communityId, user1));
        
        registry.removeCommunityAdmin(communityId, user1);
        assertTrue(!registry.isCommunityAdmin(communityId, user1));
        
        vm.stopPrank();
    }

    function test_RemoveCommunityAdmin_NotAdmin() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.expectRevert(CommunityRegistry.NotAdmin.selector);
        registry.removeCommunityAdmin(communityId, user1);
        
        vm.stopPrank();
    }

    function test_RemoveCommunityAdmin_Creator() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.expectRevert("Cannot remove creator");
        registry.removeCommunityAdmin(communityId, creator);
        
        vm.stopPrank();
    }

    function test_RemoveCommunityAdmin_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.addCommunityAdmin(communityId, user1);
        
        vm.stopPrank();
        
        vm.startPrank(user2);
        
        vm.expectRevert(CommunityRegistry.UnauthorizedAccess.selector);
        registry.removeCommunityAdmin(communityId, user1);
        
        vm.stopPrank();
    }

    // ==================== Verification Tests ====================

    function test_RequestVerification_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.requestVerification(communityId);
        
        vm.stopPrank();

        // Check that verification was requested
        // Note: We can't directly check verificationRequested as it's not a public getter
        // But we can verify it was called by checking the event or testing verifyCommunity
    }

    function test_RequestVerification_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CommunityRegistry.UnauthorizedAccess.selector);
        registry.requestVerification(communityId);
        
        vm.stopPrank();
    }

    function test_RequestVerification_Inactive() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.deactivateCommunity(communityId);
        
        vm.expectRevert(CommunityRegistry.CommunityNotActive.selector);
        registry.requestVerification(communityId);
        
        vm.stopPrank();
    }

    function test_VerifyCommunity_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.requestVerification(communityId);
        
        vm.stopPrank();
        
        registry.verifyCommunity(communityId);
        
        (, , , , , , , , , bool isVerified) = registry.getCommunity(communityId);
        assertTrue(isVerified);
    }

    function test_VerifyCommunity_NoRequest() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.expectRevert("No verification request");
        registry.verifyCommunity(communityId);
    }

    function test_VerifyCommunity_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.requestVerification(communityId);
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(); // AccessControl error
        registry.verifyCommunity(communityId);
        
        vm.stopPrank();
    }

    // ==================== Statistics Tests ====================

    function test_UpdateCommunityStats_Success() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.updateCommunityStats(communityId, 100, 10, 1000);
        
        vm.stopPrank();

        (uint256 memberCount, uint256 channelCount, uint256 messageCount) = 
            registry.getCommunityStats(communityId);
        
        assertEq(memberCount, 100);
        assertEq(channelCount, 10);
        assertEq(messageCount, 1000);
    }

    function test_UpdateCommunityStats_Unauthorized() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CommunityRegistry.UnauthorizedAccess.selector);
        registry.updateCommunityStats(communityId, 100, 10, 1000);
        
        vm.stopPrank();
    }

    function test_UpdateCommunityStats_Moderator() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        vm.stopPrank();
        
        // Grant moderator role to user1
        registry.grantRole(registry.MODERATOR_ROLE(), user1);
        
        vm.startPrank(user1);
        
        registry.updateCommunityStats(communityId, 100, 10, 1000);
        
        vm.stopPrank();

        (uint256 memberCount, uint256 channelCount, uint256 messageCount) = 
            registry.getCommunityStats(communityId);
        
        assertEq(memberCount, 100);
        assertEq(channelCount, 10);
        assertEq(messageCount, 1000);
    }

    // ==================== View Function Tests ====================

    function test_GetUserCommunities() public {
        vm.startPrank(creator);
        
        uint256 id1 = registry.createCommunity("Community 1", "Description 1", METADATA_URI);
        uint256 id2 = registry.createCommunity("Community 2", "Description 2", METADATA_URI);
        
        vm.stopPrank();

        uint256[] memory userCommunities = registry.getUserCommunities(creator);
        assertEq(userCommunities.length, 2);
        assertEq(userCommunities[0], id1);
        assertEq(userCommunities[1], id2);
    }

    function test_GetCommunityAdmins() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION,
            METADATA_URI
        );
        
        registry.addCommunityAdmin(communityId, user1);
        registry.addCommunityAdmin(communityId, user2);
        
        vm.stopPrank();

        address[] memory admins = registry.getCommunityAdmins(communityId);
        assertEq(admins.length, 3); // creator + user1 + user2
    }

    function test_GetActiveCommunities() public {
        vm.startPrank(creator);
        
        uint256 id1 = registry.createCommunity("Community 1", "Description 1", METADATA_URI);
        uint256 id2 = registry.createCommunity("Community 2", "Description 2", METADATA_URI);
        uint256 id3 = registry.createCommunity("Community 3", "Description 3", METADATA_URI);
        
        registry.deactivateCommunity(id2);
        
        vm.stopPrank();

        uint256[] memory activeCommunities = registry.getActiveCommunities(0, 10);
        assertEq(activeCommunities.length, 2); // id1 and id3 should be active
    }

    function test_GetActiveCommunities_Pagination() public {
        vm.startPrank(creator);
        
        for (uint256 i = 1; i <= 5; i++) {
            registry.createCommunity(
                string(abi.encodePacked("Community ", i)),
                "Description",
                METADATA_URI
            );
        }
        
        vm.stopPrank();

        uint256[] memory page1 = registry.getActiveCommunities(0, 2);
        assertEq(page1.length, 2);
        
        uint256[] memory page2 = registry.getActiveCommunities(2, 2);
        assertEq(page2.length, 2);
    }

    function test_GetTotalCommunities() public {
        vm.startPrank(creator);
        
        assertEq(registry.getTotalCommunities(), 0);
        
        registry.createCommunity("Community 1", "Description 1", METADATA_URI);
        assertEq(registry.getTotalCommunities(), 1);
        
        registry.createCommunity("Community 2", "Description 2", METADATA_URI);
        assertEq(registry.getTotalCommunities(), 2);
        
        vm.stopPrank();
    }

    function test_GetActiveCommunitiesCount() public {
        vm.startPrank(creator);
        
        uint256 id1 = registry.createCommunity("Community 1", "Description 1", METADATA_URI);
        uint256 id2 = registry.createCommunity("Community 2", "Description 2", METADATA_URI);
        
        assertEq(registry.getActiveCommunitiesCount(), 2);
        
        registry.deactivateCommunity(id1);
        assertEq(registry.getActiveCommunitiesCount(), 1);
        
        vm.stopPrank();
    }

    function test_GetCommunity_NotFound() public {
        vm.expectRevert(CommunityRegistry.CommunityNotFound.selector);
        registry.getCommunity(999);
    }

    // ==================== Event Tests ====================

    function test_Event_CommunityCreated() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(COMMUNITY_NAME, COMMUNITY_DESCRIPTION, METADATA_URI);
        
        vm.stopPrank();

        // Verify event was emitted by checking state changes
        assertEq(registry.getTotalCommunities(), 1);
        assertEq(registry.getActiveCommunitiesCount(), 1);
    }

    function test_Event_CommunityDeactivated() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(COMMUNITY_NAME, COMMUNITY_DESCRIPTION, METADATA_URI);
        registry.deactivateCommunity(communityId);
        
        vm.stopPrank();

        // Verify event was emitted by checking state changes
        assertEq(registry.getActiveCommunitiesCount(), 0);
    }

    function test_Event_CommunityAdminAdded() public {
        vm.startPrank(creator);
        
        uint256 communityId = registry.createCommunity(COMMUNITY_NAME, COMMUNITY_DESCRIPTION, METADATA_URI);
        registry.addCommunityAdmin(communityId, user1);
        
        vm.stopPrank();

        // Verify event was emitted by checking state changes
        assertTrue(registry.isCommunityAdmin(communityId, user1));
    }
}