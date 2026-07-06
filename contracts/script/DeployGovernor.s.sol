// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Governor.sol";

/**
 * @title DeployGovernor
 * @notice Deployment script for the Governor contract
 * @dev Deploys Governor with configurable voting parameters and token/membership addresses
 *
 * Usage:
 *   forge script script/DeployGovernor.s.sol:DeployGovernor \
 *     --rpc-url base_sepolia \
 *     --broadcast \
 *     --verify
 *
 * Required environment variables:
 *   PRIVATE_KEY            - Deployer private key
 *   VOTING_TOKEN_ADDRESS   - Address of the ERC20Votes token
 *   MEMBERSHIP_CONTRACT    - Address of the MembershipPass contract
 */
contract DeployGovernor is Script {
    // Default voting parameters
    uint256 constant DEFAULT_VOTING_DELAY = 1 days;
    uint256 constant DEFAULT_VOTING_PERIOD = 7 days;
    uint256 constant DEFAULT_PROPOSAL_THRESHOLD = 1e18; // 1 token

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Read configuration from environment
        address votingToken = vm.envAddress("VOTING_TOKEN_ADDRESS");
        address membershipContract = vm.envAddress("MEMBERSHIP_CONTRACT");

        // Optional overrides from env
        uint256 votingDelay = vm.envOr("VOTING_DELAY", DEFAULT_VOTING_DELAY);
        uint256 votingPeriod = vm.envOr("VOTING_PERIOD", DEFAULT_VOTING_PERIOD);
        uint256 proposalThreshold = vm.envOr(
            "PROPOSAL_THRESHOLD",
            DEFAULT_PROPOSAL_THRESHOLD
        );

        console.log("=== Deploying Aether Governor ===");
        console.log("Deployer:", deployer);
        console.log("Voting Token:", votingToken);
        console.log("Membership Contract:", membershipContract);
        console.log("Voting Delay:", votingDelay);
        console.log("Voting Period:", votingPeriod);
        console.log("Proposal Threshold:", proposalThreshold);

        vm.startBroadcast(deployerPrivateKey);

        Governor governor = new Governor(
            IVotingToken(votingToken),
            membershipContract,
            votingDelay,
            votingPeriod,
            proposalThreshold,
            deployer
        );

        console.log("\nGovernor deployed at:", address(governor));

        vm.stopBroadcast();

        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("Governor:", address(governor));
        console.log("Name:", governor.name());
        console.log("Admin:", deployer);
        console.log(
            "Roles granted: DEFAULT_ADMIN, ADMIN, PROPOSER, EXECUTOR"
        );
    }
}
