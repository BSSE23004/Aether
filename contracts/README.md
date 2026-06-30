# Aether Smart Contracts

Aether smart contracts built with Foundry and Solidity for the student-budget-safe Web3 collaboration platform.

## 📋 Overview

This repository contains the smart contracts for the Aether platform, including:

- **CommunityRegistry**: Advanced community registry with metadata and admin management
- **AetherCommunity**: Community registry and management
- **AetherGovernance**: DAO governance system for proposals and voting
- **AetherMembership**: ERC721 membership NFTs for community access

## 🏗️ Architecture

### Contract Hierarchy

```
CommunityRegistry
    ↓
AetherMembership (ERC721)
    ↓
AetherGovernance
    ↓
AetherCommunity
```

### Key Features

- **Community Registry**: Advanced community creation with metadata and admin management
- **DAO Governance**: Proposal creation, voting, and execution
- **Membership NFTs**: ERC721 tokens for community access
- **Access Control**: Role-based permissions for security
- **Reentrancy Protection**: Security best practices
- **Metadata Support**: IPFS and HTTP metadata URIs
- **Admin Management**: Multi-admin support for communities
- **Verification System**: Community verification process

## 🚀 Getting Started

### Prerequisites

- Foundry installed (`forge --version`)
- Node.js and pnpm (for workspace integration)
- Git

### Installation

1. **Clone the repository**
   ```bash
   cd /home/ibrahim/Git/Aether/contracts
   ```

2. **Install dependencies**
   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

### Environment Variables

Required environment variables in `.env`:

```bash
# Network Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here

# Explorer Configuration
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 📝 Development

### Building

```bash
# Build contracts
forge build

# Clean build artifacts
forge clean
```

### Testing

```bash
# Run all tests
forge test

# Run tests with gas reports
pnpm run test:gas

# Run tests with coverage
pnpm run test:coverage

# Run tests in CI mode
pnpm run test:ci
```

### Formatting

```bash
# Format code
pnpm run format

# Check formatting
pnpm run format:check
```

### Gas Optimization

```bash
# Generate gas reports
pnpm run test:gas
```

## 🚢 Deployment

### Local Deployment

```bash
# Deploy to local network
pnpm run deploy:local
```

### Base Sepolia Deployment

```bash
# Deploy all contracts to Base Sepolia testnet
pnpm run deploy:base-sepolia

# Deploy only CommunityRegistry
pnpm run deploy:registry
```

### Manual Deployment

```bash
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## 🧪 Testing

### Test Structure

```
test/
├── AetherMembership.t.sol
├── AetherCommunity.t.sol
└── AetherGovernance.t.sol
```

### Running Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-test test_AetherMembership

# Run with verbosity
forge test -vvv

# Run with gas report
forge test --gas-report
```

### Test Coverage

```bash
# Generate coverage report
pnpm run test:coverage
```

## 🔐 Security

### Security Features

- **AccessControl**: Role-based permissions
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency stop functionality (future)
- **OpenZeppelin**: Audited standard libraries

### Security Best Practices

1. **Never commit private keys** to the repository
2. **Use environment variables** for sensitive data
3. **Run tests** before deployment
4. **Verify contracts** on block explorers
5. **Audit contracts** before mainnet deployment

### Known Security Considerations

- Simple majority voting (upgrade to quadratic voting in future)
- No time-lock for governance execution (add in future)
- No multisig for admin operations (add in future)

## 📚 Contract Documentation

### CommunityRegistry

Advanced community registry contract with metadata and admin management.

**Key Functions:**
- `createCommunity(string name, string description, string metadataURI)`: Create new community with metadata
- `updateCommunity(uint256 communityId, string name, string description, string metadataURI)`: Update community metadata
- `deactivateCommunity(uint256 communityId)`: Deactivate a community
- `activateCommunity(uint256 communityId)`: Reactivate a community (admin only)
- `addCommunityAdmin(uint256 communityId, address admin)`: Add admin to community
- `removeCommunityAdmin(uint256 communityId, address admin)`: Remove admin from community
- `requestVerification(uint256 communityId)`: Request community verification
- `verifyCommunity(uint256 communityId)`: Verify community (platform admin only)
- `updateCommunityStats(uint256 communityId, uint256 memberCount, uint256 channelCount, uint256 messageCount)`: Update community statistics

**Features:**
- Metadata URI support (IPFS and HTTP)
- Multi-admin support per community
- Community verification system
- Community statistics tracking
- Pagination support for community listing
- Duplicate name prevention

### AetherMembership

ERC721 membership NFT contract for community access.

**Key Functions:**
- `mintMembership(address to, string memory metadataURI)`: Mint membership with payment
- `adminMint(address to, string memory metadataURI)`: Admin mint without payment
- `setMembershipPrice(uint256 newPrice)`: Update membership price
- `getUserMemberships(address user)`: Get user's membership tokens

### AetherGovernance

DAO governance contract for proposals and voting.

**Key Functions:**
- `createProposal(string title, string description)`: Create governance proposal
- `vote(uint256 proposalId, bool support)`: Vote on proposal
- `executeProposal(uint256 proposalId)`: Execute passed proposal
- `getProposalState(uint256 proposalId)`: Get proposal state

### AetherCommunity

Legacy community registry contract (being replaced by CommunityRegistry).

**Key Functions:**
- `createCommunity(string name, string description)`: Create new community
- `updateCommunity(uint256 communityId, string name, string description)`: Update community
- `deactivateCommunity(uint256 communityId)`: Deactivate community
- `getUserCommunities(address user)`: Get user's communities
- `getCommunity(uint256 communityId)`: Get community details

**Note:** This contract is being phased out in favor of CommunityRegistry.

## 🔗 Network Configuration

### Base Sepolia

- **RPC URL**: `https://sepolia.base.org`
- **Chain ID**: 84532
- **Explorer**: https://sepolia.basescan.org
- **Currency**: ETH

### Local Development

- **RPC URL**: `http://localhost:8545`
- **Chain ID**: 31337
- **Currency**: ETH

## 🛠️ Troubleshooting

### Common Issues

**Issue**: `Private key is too long`
- **Solution**: Ensure private key is without `0x` prefix and is 64 hex characters

**Issue**: `Network connection error`
- **Solution**: Check RPC URL and internet connection

**Issue**: `Verification failed`
- **Solution**: Ensure ETHERSCAN_API_KEY is set correctly

### Debug Mode

```bash
# Run with debug output
forge test -vvvv

# Run with traces
forge test --trace
```

## 📦 Dependencies

- **Foundry**: Framework for smart contract development
- **OpenZeppelin Contracts**: Audited smart contract libraries
- **OpenZeppelin Contracts Upgradeable**: Upgradeable contract patterns

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Run tests before committing

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/aether/issues)
- Documentation: [Aether Docs](https://docs.aether.dev)

## 🔮 Roadmap

- [ ] Add timelock for governance execution
- [ ] Implement quadratic voting
- [ ] Add multisig for admin operations
- [ ] Implement upgradeable contracts
- [ ] Add comprehensive audits
- [ ] Mainnet deployment