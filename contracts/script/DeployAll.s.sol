// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CommunityRegistry.sol";
import "../src/AetherCommunity.sol";
import "../src/AetherGovernance.sol";
import "../src/AetherMembership.sol";
import "../src/MembershipPass.sol";
import "../src/Governor.sol";
import "../test/mocks/MockERC20Votes.sol"; // For deploying a dummy voting token

/**
 * @title DeployAll
 * @notice Deployment script for all Aether contracts
 * @dev Deploys contracts in the correct order with proper initialization
 */
contract DeployAll is Script {
    // Deployed contract addresses
    CommunityRegistry public registryContract;
    AetherCommunity public communityContract;
    AetherGovernance public legacyGovernanceContract;
    Governor public governorContract;
    AetherMembership public membershipContract;
    MembershipPass public membershipPassContract;
    MockERC20Votes public votingToken;

    // Deployment parameters
    string constant COMMUNITY_NAME = "Aether";
    string constant COMMUNITY_SYMBOL = "AETH";
    string constant COMMUNITY_DESCRIPTION = "Aether - Student Budget Safe Web3 Collaboration Platform";
    uint256 constant INITIAL_TREASURY = 0; // No initial treasury funding
    uint256 constant VOTING_PERIOD = 7 days;
    uint256 constant QUORUM_PERCENTAGE = 10; // 10% quorum required
    uint256 constant MEMBERSHIP_PRICE = 0.01 ether; // Low cost for students
    uint256 constant MAX_SUPPLY = 10000; // Membership pass max supply

    // Governor specific params
    uint256 constant VOTING_DELAY = 1 days;
    uint256 constant PROPOSAL_THRESHOLD = 1e18;

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

        // Deploy legacy governance contract
        legacyGovernanceContract = new AetherGovernance(
            address(membershipContract),
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        );
        console.log("Legacy AetherGovernance deployed at:", address(legacyGovernanceContract));

        // Deploy community contract
        communityContract = new AetherCommunity(
            address(membershipContract),
            address(legacyGovernanceContract),
            COMMUNITY_NAME,
            COMMUNITY_DESCRIPTION
        );
        console.log("AetherCommunity deployed at:", address(communityContract));

        // Deploy a mock voting token for Governor
        votingToken = new MockERC20Votes("Aether Voting Token", "AVT");
        console.log("Voting Token deployed at:", address(votingToken));

        // Deploy new Governor contract
        governorContract = new Governor(
            votingToken,
            address(membershipPassContract),
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            deployer
        );
        console.log("Governor deployed at:", address(governorContract));

        // Grant governance permissions to community contract (legacy)
        legacyGovernanceContract.grantRole(
            legacyGovernanceContract.ADMIN_ROLE(),
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
        console.log("Legacy Governance:", address(legacyGovernanceContract));
        console.log("Community:", address(communityContract));
        console.log("Voting Token:", address(votingToken));
        console.log("Governor:", address(governorContract));
        console.log("Deployer:", deployer);
    }
}