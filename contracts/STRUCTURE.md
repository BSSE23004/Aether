# Foundry Setup - Folder Structure

```
contracts/
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── foundry.toml                    # Foundry configuration
├── package.json                    # npm scripts for workspace
├── README.md                      # Main documentation
├── DEPLOYMENT.md                  # Deployment guide
├── STRUCTURE.md                   # This file
├── src/                           # Contract source files
│   ├── AetherCommunity.sol        # Community registry contract
│   ├── AetherGovernance.sol       # DAO governance contract
│   └── AetherMembership.sol       # ERC721 membership NFT contract
├── script/                        # Deployment scripts
│   └── DeployAll.s.sol           # Main deployment script
├── test/                         # Test files
│   ├── AetherCommunity.t.sol     # Community contract tests
│   ├── AetherGovernance.t.sol    # Governance contract tests
│   └── AetherMembership.t.sol    # Membership contract tests
└── lib/                          # Dependencies
    ├── openzeppelin-contracts/   # OpenZeppelin contracts
    └── forge-std/               # Foundry standard library
```

## File Descriptions

### Configuration Files

- **foundry.toml**: Main Foundry configuration with compiler settings, network endpoints, and test profiles
- **.env.example**: Template for environment variables (RPC URLs, private keys, API keys)
- **.gitignore**: Files to exclude from version control (build artifacts, env files)
- **package.json**: npm scripts for integration with the monorepo

### Source Contracts

- **AetherCommunity.sol**: Manages community registry, creation, and updates
- **AetherGovernance.sol**: Handles DAO proposals, voting, and execution
- **AetherMembership.sol**: ERC721 membership NFTs for community access

### Deployment Scripts

- **DeployAll.s.sol**: Deploys all contracts in the correct order with proper initialization

### Test Files

- **AetherCommunity.t.sol**: Comprehensive tests for community functionality
- **AetherGovernance.t.sol**: Tests for governance proposals and voting
- **AetherMembership.t.sol**: Tests for membership minting and management

### Dependencies

- **openzeppelin-contracts/**: Audited smart contract libraries (ERC721, AccessControl, etc.)
- **forge-std/**: Foundry's standard library for testing and scripting

## Key Features

### Security
- AccessControl for role-based permissions
- ReentrancyGuard for protection against reentrancy attacks
- OpenZeppelin audited libraries
- Comprehensive test coverage

### Development
- Hot reloading via Foundry
- Gas reporting and optimization
- Fuzz testing support
- CI/CD ready configuration

### Deployment
- Multi-network support (Base Sepolia, Local)
- Contract verification
- Environment-based configuration
- Gas optimization

## Network Configuration

### Base Sepolia (Testnet)
- RPC: https://sepolia.base.org
- Chain ID: 84532
- Explorer: https://sepolia.basescan.org

### Local Development
- RPC: http://localhost:8545
- Chain ID: 31337
- Anvil for local testing

## Scripts

### Build & Test
```bash
pnpm run build          # Build contracts
pnpm run test           # Run tests
pnpm run test:gas       # Run with gas reports
pnpm run test:coverage  # Run with coverage
```

### Deployment
```bash
pnpm run deploy:base-sepolia  # Deploy to Base Sepolia
pnpm run deploy:local         # Deploy to local network
```

### Utilities
```bash
pnpm run format          # Format code
pnpm run format:check    # Check formatting
pnpm run clean           # Clean build artifacts
```

## Environment Variables

Required:
- `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC endpoint
- `PRIVATE_KEY`: Deployer private key (without 0x prefix)

Optional:
- `ETHERSCAN_API_KEY`: For contract verification
- `BASESCAN_API_KEY`: Base-specific API key

## Next Steps

1. **Development**: Implement additional contract features
2. **Testing**: Expand test coverage
3. **Deployment**: Deploy to Base Sepolia testnet
4. **Integration**: Connect with frontend and backend
5. **Audit**: Security audit before mainnet deployment