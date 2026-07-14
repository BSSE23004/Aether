# Aether Blockchain Indexer

A robust, modular blockchain event indexer for the Aether platform that monitors Base Sepolia blockchain for contract events and synchronizes them with the PostgreSQL database.

## Features

- **Modular Event Handlers**: Separate handlers for CommunityRegistry, MembershipPass, and Governor contracts
- **Reorg-Safe Processing**: Automatic detection and handling of blockchain reorganizations
- **Retry Mechanism**: Exponential backoff for RPC and database failures
- **Batch Processing**: Efficient block and event processing with configurable batch sizes
- **Redis Integration**: Optional caching and coordination layer
- **Structured Logging**: Comprehensive logging with configurable log levels
- **Health Monitoring**: Built-in health checks and statistics tracking
- **Error Recovery**: Graceful error handling with dead letter queue for failed events

## Architecture

### Core Components

1. **Indexer Engine** (`src/core/indexer.ts`)
   - Main coordinator for all components
   - Block processing loop
   - Statistics tracking

2. **Block Tracker** (`src/core/block-tracker.ts`)
   - Block polling and tracking
   - Reorg detection and handling
   - Sync state management

3. **Event Extractor** (`src/core/event-extractor.ts`)
   - Log extraction from blocks
   - Event parsing using contract ABIs
   - Event type mapping

4. **Event Handlers** (`src/handlers/`)
   - Base handler class with common functionality
   - CommunityRegistry handler
   - MembershipPass handler
   - Governor handler
   - Handler registry for coordination

5. **Services** (`src/services/`)
   - Database service (Prisma)
   - Redis service (optional)
   - Logger service
   - Retry service

6. **Configuration** (`src/config/`)
   - Network configurations
   - Contract configurations
   - Environment-based configuration loading

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (optional)
- Contract addresses deployed on Base Sepolia

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Configure environment variables
nano .env
```

### Configuration

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5433/database"

# Redis Configuration
REDIS_URL="redis://localhost:6380"
ENABLE_REDIS="true"

# Blockchain Configuration
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"

# Contract Addresses (set after deployment)
COMMUNITY_REGISTRY_ADDRESS="0x..."
MEMBERSHIP_PASS_ADDRESS="0x..."
GOVERNOR_ADDRESS="0x..."

# Indexer Configuration
POLL_INTERVAL="2000"           # Block polling interval in ms
BATCH_SIZE="100"              # Number of blocks to process per batch
MAX_RETRIES="5"               # Maximum retry attempts
RETRY_DELAY="1000"            # Initial retry delay in ms

# Notification Configuration
ENABLE_NOTIFICATIONS="true"

# Logging Configuration
LOG_LEVEL="info"               # debug, info, warn, error
```

### Database Setup

```bash
# Update Prisma schema with lastBlockHash field
# The schema has been updated in apps/api/prisma/schema.prisma

# Run migrations
cd apps/api
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

## Usage

### Development

```bash
# Start indexer in development mode with hot reload
pnpm dev
```

### Production

```bash
# Build the project
pnpm build

# Start the indexer
pnpm start
```

### Monitoring

The indexer provides comprehensive logging and statistics:

- **Current Block**: Latest block number from chain
- **Last Processed Block**: Last block successfully processed
- **Lag**: Difference between current and last processed block
- **Events Processed**: Total number of events processed
- **Errors**: Total number of errors encountered
- **Reorg Count**: Number of reorganizations detected
- **Uptime**: Time since indexer started

## Event Handlers

### CommunityRegistry Handler

Handles events from the CommunityRegistry contract:
- `CommunityCreated`
- `CommunityUpdated`
- `CommunityDeactivated`
- `CommunityActivated`
- `CommunityAdminAdded`
- `CommunityAdminRemoved`
- `CommunityVerificationRequested`
- `CommunityVerified`
- `CommunityStatsUpdated`

### MembershipPass Handler

Handles events from the MembershipPass contract:
- `MembershipMinted`
- `MembershipBurned`
- `MembershipPriceUpdated`
- `TreasuryUpdated`
- `MaxSupplyUpdated`
- `MembershipExtended`

### Governor Handler

Handles events from the Governor contract:
- `ProposalCreated`
- `VoteCast`
- `ProposalExecuted`
- `ProposalCanceled`
- `MembershipContractUpdated`
- `VotingParametersUpdated`

## Reorg Handling

The indexer automatically detects and handles blockchain reorganizations:

1. **Detection**: Compares block hashes at the last processed block
2. **Rollback**: Deletes events from affected blocks
3. **Recovery**: Resumes processing from the last safe block
4. **Logging**: Comprehensive logging of reorg events

## Error Handling

The indexer implements robust error handling:

- **RPC Failures**: Exponential backoff retry (1s, 2s, 4s, 8s, 16s)
- **Database Errors**: Transaction rollback and retry
- **Event Processing Errors**: Individual event isolation
- **Fatal Errors**: Graceful shutdown with logging

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -p 5433 -U aether -d aether_dev
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -p 6380 ping
```

### RPC Connection Issues

```bash
# Test RPC endpoint
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Missing Contract ABIs

The indexer needs contract ABIs to parse events. These should be loaded from the Foundry artifacts:

```bash
# Contracts are located in /contracts/out/{contractName}/solc/{contractName}.json
# The ABI loader will automatically load these when configured
```

## Performance Tuning

### Adjust Poll Interval

For faster processing with higher RPC costs:
```env
POLL_INTERVAL="1000"  # Poll every second
```

For lower RPC costs with slower processing:
```env
POLL_INTERVAL="5000"  # Poll every 5 seconds
```

### Adjust Batch Size

For networks with many events per block:
```env
BATCH_SIZE="50"  # Process fewer blocks per batch
```

For networks with few events per block:
```env
BATCH_SIZE="200"  # Process more blocks per batch
```

## Extending the Indexer

### Adding a New Contract Handler

1. Create a new handler class extending `BaseHandler`
2. Implement the `getSupportedEvents()` method
3. Implement the `processEvent()` method
4. Register the handler in `HandlerRegistry`

Example:

```typescript
import { BaseHandler } from './base-handler.js';
import { ProcessedEvent } from '../types/index.js';

export class MyContractHandler extends BaseHandler {
  constructor() {
    super('MyContract');
  }

  getSupportedEvents(): string[] {
    return ['MyEvent'];
  }

  async processEvent(event: ProcessedEvent): Promise<void> {
    // Handle event processing
  }
}
```

## License

MIT