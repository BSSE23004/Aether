// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CommunityRegistry.sol";
import "../src/AetherCommunity.sol";
import "../src/AetherGovernance.sol";
import "../src/AetherMembership.sol";
import "../src/MembershipPass.sol";

/**
 * @title DeployAll
 * @notice Deployment script for all Aether contracts
 * @dev Deploys contracts in the correct order with proper initialization
 */
contract DeployAll is Script {
    // Deployed contract addresses
    CommunityRegistry public registryContract;
    AetherCommunity public communityContract;
    AetherGovernance public governanceContract;
    AetherMembership public membershipContract;
    MembershipPass public membershipPassContract;

    // Deployment parameters
    string constant COMMUNITY_NAME = "Aether";
    string constant COMMUNITY_SYMBOL = "AETH";
    string constant COMMUNITY_DESCRIPTION = "Aether - Student Budget Safe Web3 Collaboration Platform";
    uint256 constant INITIAL_TREASURY = 0; // No initial treasury funding
    uint256 constant VOTING_PERIOD = 7 days;
    uint256 constant QUORUM_PERCENTAGE = 10; // 10% quorum required
    uint256 constant MEMBERSHIP_PRICE = 0.01 ether; // Low cost for students
    uint256 constant MAX_SUPPLY = 10000; // Membership pass max supply

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy community registry first
        registryContract = new CommunityRegistry(deployer);
        console.log("CommunityRegistry deployed at:", address(registryContract));

        // Deploy membership pass contract (new)
        membershipPassContract = new MembershipPass(
            "Aether Membership Pass",
            "AMP",
            MEMBERSHIP_PRICE,
            MAX_SUPPLY,
            deployer
        );
        console.log("MembershipPass deployed at:", address(membershipPassContract));

        // Deploy legacy membership contract
        membershipContract = new AetherMembership(
            COMMUNITY_NAME,
            COMMUNITY_SYMBOL,
            MEMBERSHIP_PRICE
        );
        console.log("AetherMembership deployed at:", address(membershipContract));

        // Deploy governance contract
        governanceContract = new AetherGovernance(
            address(membershipContract),
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        );
        console.log("AetherGovernance deployed at:", address(governanceContract));

        // Deploy community contract
        communityContract = new AetherCommunity(
            address(membershipContract),
            address(governanceContract),
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION
        );
        console.log("AetherCommunity deployed at:", address(communityContract));

        // Grant governance permissions to community contract
        governanceContract.grantRole(
            governanceContract.ADMIN_ROLE(),
            address(communityContract)
        );

        // Grant membership minter role to community contract
        membershipContract.grantRole(
            membershipContract.MINTER_ROLE(),
            address(communityContract)
        );

        // Grant creator role to deployer in registry
        registryContract.grantRole(
            registryContract.CREATOR_ROLE(),
            deployer
        );

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Registry:", address(registryContract));
        console.log("MembershipPass:", address(membershipPassContract));
        console.log("AetherMembership:", address(membershipContract));
        console.log("Governance:", address(governanceContract));
        console.log("Community:", address(communityContract));
        console.log("Deployer:", deployer);
    }
}