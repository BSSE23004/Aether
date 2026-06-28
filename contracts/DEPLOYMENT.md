# Deployment Guide

This guide covers deploying Aether smart contracts to Base Sepolia testnet.

## Prerequisites

1. **Foundry installed**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Testnet ETH**
   - Get Base Sepolia ETH from: https://sepoliafaucet.com/
   - Or use official Base faucet: https://www.base.org/faucets

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

## Configuration

### Environment Variables

Edit `.env` file:

```bash
# Required
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_without_0x_prefix

# Optional
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Private Key Format

- Remove `0x` prefix
- Should be 64 hex characters
- Example: `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

## Deployment Steps

### 1. Build Contracts

```bash
forge build
```

### 2. Run Tests

```bash
forge test
```

### 3. Deploy to Base Sepolia

```bash
pnpm run deploy:base-sepolia
```

Or manually:

```bash
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vv
```

### 4. Verify Deployment

Check the deployment output for contract addresses:

```
=== Deployment Summary ===
Membership: 0x1234...
Governance: 0x5678...
Community: 0x9abc...
```

### 5. Verify on Explorer

Visit Base Sepolia explorer:
- https://sepolia.basescan.org/address/CONTRACT_ADDRESS

## Deployment Parameters

The deployment script uses these parameters:

```solidity
COMMUNITY_NAME = "Aether"
COMMUNITY_SYMBOL = "AETH"
COMMUNITY_DESCRIPTION = "Aether - Student Budget Safe Web3 Collaboration Platform"
INITIAL_TREASURY = 0
VOTING_PERIOD = 7 days
QUORUM_PERCENTAGE = 10
MEMBERSHIP_PRICE = 0.01 ether
```

## Post-Deployment

### 1. Save Contract Addresses

Save the deployed addresses to your backend configuration:

```bash
# Example .env for backend
MEMBERSHIP_CONTRACT=0x...
GOVERNANCE_CONTRACT=0x...
COMMUNITY_CONTRACT=0x...
```

### 2. Update Frontend

Update frontend wagmi config with deployed contracts:

```typescript
// src/lib/wagmi.ts
const contracts = {
  membership: {
    address: '0x...', // Deployed address
    abi: MembershipABI,
  },
  // ... other contracts
}
```

### 3. Fund Treasury (Optional)

If you want to fund the treasury:

```bash
cast send $TREasury_ADDRESS \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --value 1ether
```

## Network Details

### Base Sepolia

- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Native Token**: ETH

### Alternative RPCs

If the main RPC is slow, try:

```bash
# Ankr
BASE_SEPOLIA_RPC_URL=https://rpc.ankr.com/base_sepolia

# Alchemy (requires API key)
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## Troubleshooting

### Insufficient Funds

```bash
# Check balance
cast balance $YOUR_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL

# Get testnet ETH
# Visit: https://sepoliafaucet.com/
```

### RPC Connection Issues

```bash
# Test RPC connection
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $BASE_SEPOLIA_RPC_URL
```

### Verification Failed

```bash
# Verify manually
forge verify-contract \
  $CONTRACT_ADDRESS \
  src/AetherMembership.sol:AetherMembership \
  --verifier-url https://api-sepolia.basescan.org/api \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --chain 84532
```

### Gas Issues

```bash
# Set higher gas limit
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --gas-limit 10000000
```

## Security Considerations

### Before Deployment

1. ✅ Run all tests: `forge test`
2. ✅ Check gas usage: `forge test --gas-report`
3. ✅ Review contract code
4. ✅ Test on local network first

### After Deployment

1. ✅ Verify contracts on explorer
2. ✅ Save deployment addresses securely
3. ✅ Update documentation
4. ✅ Monitor for issues

### Key Security Points

- Never commit private keys
- Use hardware wallets for mainnet
- Implement multisig for critical operations
- Consider using timelock for governance
- Audit contracts before mainnet

## Monitoring

### Check Contract Status

```bash
# Check if contract is verified
cast code $CONTRACT_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL

# Check contract owner
cast call $CONTRACT_ADDRESS "owner()" --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Event Monitoring

```bash
# Listen for events
cast subscribe --rpc-url $BASE_SEPOLIA_RPC_URL
```

## Next Steps

1. **Test the deployment**: Interact with contracts via frontend
2. **Monitor gas usage**: Optimize if needed
3. **Update documentation**: Keep addresses current
4. **Plan mainnet deployment**: When ready for production

## Support

For deployment issues:
- Check Foundry docs: https://book.getfoundry.sh/
- Base docs: https://docs.base.org/
- GitHub Issues: [Create an issue](https://github.com/your-org/aether/issues)