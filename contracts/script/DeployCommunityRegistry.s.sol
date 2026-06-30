// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CommunityRegistry.sol";

/**
 * @title DeployCommunityRegistry
 * @notice Deployment script for CommunityRegistry contract
 * @dev Deploys the registry with proper role configuration
 */
contract DeployCommunityRegistry is Script {
    // Deployment parameters
    address public deployer;
    address public initialAdmin;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        initialAdmin = deployer; // Use deployer as initial admin

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CommunityRegistry
        CommunityRegistry registry = new CommunityRegistry(initialAdmin);
        
        console.log("CommunityRegistry deployed at:", address(registry));
        console.log("Initial admin:", initialAdmin);
        console.log("Deployer:", deployer);

        // Verify deployment
        console.log("\n=== Deployment Verification ===");
        console.log("Total communities:", registry.getTotalCommunities());
        console.log("Active communities:", registry.getActiveCommunitiesCount());
        console.log("Default admin role:", registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), initialAdmin));
        console.log("Admin role:", registry.hasRole(registry.ADMIN_ROLE(), initialAdmin));
        console.log("Creator role:", registry.hasRole(registry.CREATOR_ROLE(), initialAdmin));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Contract address:", address(registry));
        console.log("Deployer:", deployer);
        console.log("Initial admin:", initialAdmin);
        console.log("Network:", block.chainid);
    }
}