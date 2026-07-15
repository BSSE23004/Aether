# Aether Blockchain Indexer

A robust, modular blockchain event indexer for the Aether platform that monitors Base Sepolia blockchain for contract events and synchronizes them with the PostgreSQL database.

## Features

- **Modular Sync Processors**: Separate processors for memberships, proposals, votes, and treasury events
- **Reorg-Safe Processing**: Automatic detection and handling of blockchain reorganizations
- **Event Validation**: Comprehensive event validation before processing
- **Event Transformation**: Layer for transforming blockchain events into database entities
- **Deduplication**: Automatic duplicate event detection and handling
- **Chain Sync State**: Maintains blockchain synchronization state in database
- **Retry Mechanism**: Exponential backoff for RPC and database failures
- **Batch Processing**: Efficient block and event processing with configurable batch sizes
- **Redis Integration**: Optional caching and coordination layer
- **Structured Logging**: Comprehensive logging with configurable log levels
- **Health Monitoring**: Built-in health checks and statistics tracking

## Architecture

### Core Components

1. **Sync Worker** (`src/sync/sync-worker.ts`)
   - Main coordinator for event synchronization
   - Block processing loop
   - Statistics tracking and health monitoring

2. **Sync Coordinator** (`src/sync/sync-coordinator.ts`)
   - Coordinates multiple sync processors
   - Routes events to appropriate processors
   - Aggregates processing results

3. **Sync Processors** (`src/sync/`)
   - **BaseSyncProcessor**: Base class with common functionality
   - **MembershipSyncProcessor**: Handles membership events
   - **ProposalSyncProcessor**: Handles proposal events
   - **VoteSyncProcessor**: Handles vote events
   - **TreasurySyncProcessor**: Handles treasury events

4. **Chain Sync State Manager** (`src/sync/chain-sync-state-manager.ts`)
   - Manages blockchain synchronization state
   - Handles state updates and rollbacks
   - Provides sync statistics

5. **Event Validator** (`src/sync/event-validator.ts`)
   - Validates blockchain events before processing
   - Type-specific validation rules
   - Filtering of invalid events

6. **Event Transformer** (`src/sync/event-transformer.ts`)
   - Transforms blockchain events into database entities
   - Entity type mapping
   - Data normalization

7. **Block Tracker** (`src/core/block-tracker.ts`)
   - Block polling and tracking
   - Reorg detection and handling
   - Sync state management

8. **Event Extractor** (`src/core/event-extractor.ts`)
   - Log extraction from blocks
   - Event parsing using contract ABIs
   - Event type mapping

9. **Services** (`src/services/`)
   - Database service (Prisma)
   - Redis service (optional)
   - Logger service
   - Retry service

10. **Configuration** (`src/config/`)
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
# Start sync worker in development mode with hot reload
pnpm dev

# Or start sync worker directly
pnpm dev:sync
```

### Production

```bash
# Build the project
pnpm build

# Start the indexer
pnpm start

# Or start sync worker directly
pnpm start:sync
```

### Monitoring

The sync worker provides comprehensive logging and statistics:

- **Current Block**: Latest block number from chain
- **Last Processed Block**: Last block successfully processed
- **Lag**: Difference between current and last processed block
- **Events Processed**: Total number of events processed
- **Events Failed**: Total number of events that failed to process
- **Events Skipped**: Total number of events skipped (duplicates)
- **Reorg Count**: Number of reorganizations detected
- **Uptime**: Time since worker started
- **Processor Stats**: Individual processor statistics

## Sync Processors

### Membership Sync Processor

Handles membership-related events:
- `MEMBERSHIP_MINTED`: Creates wallet records and stores membership data
- `MEMBERSHIP_BURNED`: Updates membership status
- `MEMBERSHIP_EXTENDED`: Updates membership expiry
- `MEMBERSHIP_PRICE_UPDATED`: Updates price configuration
- `TREASURY_UPDATED`: Updates treasury address
- `MAX_SUPPLY_UPDATED`: Updates supply limits

### Proposal Sync Processor

Handles governance proposal events:
- `PROPOSAL_CREATED`: Creates proposal records linked to users
- `PROPOSAL_EXECUTED`: Updates proposal status to executed
- `PROPOSAL_CANCELED`: Updates proposal status to canceled
- `VOTING_PARAMETERS_UPDATED`: Updates governance parameters
- `MEMBERSHIP_CONTRACT_UPDATED`: Updates membership contract reference

### Vote Sync Processor

Handles voting events:
- `VOTE_CAST`: Creates vote records and updates proposal vote counts
- Automatically updates proposal statistics (for/against/abstain)
- Links votes to user accounts via wallet addresses

### Treasury Sync Processor

Handles treasury configuration events:
- `TREASURY_UPDATED`: Tracks treasury address changes
- `MEMBERSHIP_PRICE_UPDATED`: Tracks price configuration changes
- `MAX_SUPPLY_UPDATED`: Tracks supply limit changes

## Event Processing Pipeline

```
Block Extraction → Event Parsing → Event Validation → 
Event Transformation → Sync Processing → Database Storage
```

1. **Block Extraction**: Extract logs from blockchain blocks
2. **Event Parsing**: Parse logs using contract ABIs
3. **Event Validation**: Validate event structure and data
4. **Event Transformation**: Transform events into database entities
5. **Sync Processing**: Route events to appropriate sync processors
6. **Database Storage**: Store events and update database entities

## Chain Sync State

The sync worker maintains detailed synchronization state:

- **Last Processed Block**: Block number of last successfully processed block
- **Last Block Hash**: Hash of last processed block (for reorg detection)
- **Last Timestamp**: Timestamp of last processed block
- **Last Processed At**: When the block was processed

This state is stored in the `ChainSyncState` database table and is used for:
- Reorg detection
- Recovery from failures
- Sync progress tracking
- Lag calculation

## Reorg Handling

The sync worker automatically detects and handles blockchain reorganizations:

1. **Detection**: Compares block hashes at the last processed block
2. **Rollback**: Deletes events from affected blocks
3. **State Recovery**: Updates sync state to last safe block
4. **Resume**: Continues processing from safe block
5. **Logging**: Comprehensive logging of reorg events

## Event Deduplication

The sync worker implements automatic deduplication:

- **Database Check**: Uses unique constraint on (txHash, logIndex)
- **Duplicate Detection**: Checks for existing events before processing
- **Skip Processing**: Skips processing of duplicate events
- **Logging**: Logs skipped duplicate events

## Error Handling

The sync worker implements robust error handling:

- **RPC Failures**: Exponential backoff retry (1s, 2s, 4s, 8s, 16s)
- **Database Errors**: Transaction rollback and retry
- **Event Processing Errors**: Individual event isolation
- **Validation Errors**: Filtering of invalid events
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

### Sync Lag Issues

If the sync worker is falling behind:
- Increase `BATCH_SIZE` to process more blocks per cycle
- Decrease `POLL_INTERVAL` to poll more frequently
- Check database performance and connection pool
- Review logs for processing errors

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

## Extending the Sync Worker

### Adding a New Sync Processor

1. Create a new processor class extending `BaseSyncProcessor`
2. Implement the `getSupportedEventTypes()` method
3. Implement the `processEvent()` method
4. Register the processor in `SyncCoordinator`

Example:

```typescript
import { BaseSyncProcessor } from './base-sync-processor.js';
import { ProcessedEvent } from '../types/index.js';

export class MyContractSyncProcessor extends BaseSyncProcessor {
  constructor() {
    super('MyContractSyncProcessor');
  }

  getSupportedEventTypes(): string[] {
    return ['MY_EVENT_TYPE'];
  }

  async processEvent(event: ProcessedEvent): Promise<void> {
    // Handle event processing
    // Validate event data
    // Transform data
    // Store in database
  }
}
```

### Adding Event Validation Rules

Add validation rules in `EventValidator`:

```typescript
private validateMyEvent(data: any, errors: Array<{ field: string; message: string }>): void {
  if (!data.requiredField) {
    errors.push({
      field: 'requiredField',
      message: 'Required field is missing'
    });
  }
}
```

### Adding Event Transformation Rules

Add transformation rules in `EventTransformer`:

```typescript
private transformMyEvent(event: ProcessedEvent): TransformedData {
  return {
    entityType: 'my_entity',
    entityId: event.data.id,
    data: {
      // Transformed data
    },
    metadata: {
      blockNumber: event.blockNumber,
      txHash: event.transactionHash
    }
  };
}
```

## License

MIT