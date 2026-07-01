// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MembershipPass.sol";

/**
 * @title DeployMembershipPass
 * @notice Deployment script for MembershipPass contract
 * @dev Deploys the membership pass with proper configuration
 */
contract DeployMembershipPass is Script {
    // Deployment parameters
    string constant NAME = "Aether Membership Pass";
    string constant SYMBOL = "AMP";
    uint256 constant MEMBERSHIP_PRICE = 0.01 ether; // Low cost for students
    uint256 constant MAX_SUPPLY = 10000; // Reasonable max supply

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MembershipPass
        MembershipPass membershipPass = new MembershipPass(
            NAME,
            SYMBOL,
            MEMBERSHIP_PRICE,
            MAX_SUPPLY,
            deployer
        );
        
        console.log("MembershipPass deployed at:", address(membershipPass));
        console.log("Deployer:", deployer);

        // Verify deployment
        console.log("\n=== Deployment Verification ===");
        console.log("Name:", membershipPass.name());
        console.log("Symbol:", membershipPass.symbol());
        console.log("Membership Price:", membershipPass.membershipPrice());
        console.log("Max Supply:", membershipPass.maxSupply());
        console.log("Treasury:", membershipPass.treasury());
        console.log("Total Minted:", membershipPass.totalMinted());
        console.log("Total Burned:", membershipPass.totalBurned());
        console.log("Total Supply:", membershipPass.totalSupply());

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Contract address:", address(membershipPass));
        console.log("Deployer:", deployer);
        console.log("Network:", block.chainid);
        console.log("Membership Price:", MEMBERSHIP_PRICE);
        console.log("Max Supply:", MAX_SUPPLY);
    }
}