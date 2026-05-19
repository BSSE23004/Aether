# Aether - Production-Style Web3 Collaboration Platform

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup Docker services
pnpm docker:up

# Verify services
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

# Start development
pnpm dev
```

## Architecture Overview

Hybrid Web3 architecture with on-chain governance and off-chain data storage.

### Apps

- **web**: Next.js 14 frontend with RainbowKit + wagmi
- **api**: NestJS backend with Socket.IO + Prisma
- **indexer**: Blockchain event listener (viem)
- **ai-service**: FastAPI + Ollama for local AI

### Packages

- **types**: Shared TypeScript types and interfaces
- **ui**: shadcn/ui components with Tailwind CSS
- **utils**: Helper functions
- **auth**: Wallet authentication (viem signing)
- **blockchain**: Contract ABIs and blockchain utilities

### Infrastructure

- **docker**: PostgreSQL, Redis, Ollama services
- **nginx**: Reverse proxy (placeholder)
- **monitoring**: Observability stack (placeholder)

## Tech Stack

**Frontend**: Next.js + TypeScript + Tailwind + shadcn/ui + Zustand + TanStack Query + wagmi + viem + RainbowKit

**Backend**: NestJS + Prisma + PostgreSQL + Redis + Socket.IO

**Blockchain**: Solidity (Foundry) + Base Sepolia

**AI**: FastAPI + Ollama (local models only)

**Infrastructure**: pnpm + Turborepo + Docker Compose + Nginx + Cloudflare

## Environment Setup

Copy `.env.example` to `.env.local` in each app:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/indexer/.env.example apps/indexer/.env.local
cp apps/ai-service/.env.example apps/ai-service/.env.local
cp contracts/.env.example contracts/.env.local
```

**Key Configuration**:

- Chain ID: 84532 (Base Sepolia)
- RPC: https://sepolia.base.org
- Database: PostgreSQL (localhost:5432)
- Redis: localhost:6379
- Ollama: localhost:11434

## Development Commands

```bash
pnpm dev               # Start all services in parallel
pnpm build             # Build all packages
pnpm lint              # Lint all code
pnpm lint:fix          # Auto-fix linting issues
pnpm type-check        # Type check all packages
pnpm test              # Run all tests
pnpm format            # Format with Prettier
pnpm docker:up         # Start Docker containers
pnpm docker:down       # Stop Docker containers
pnpm docker:logs       # View Docker logs
pnpm db:migrate        # Run database migrations
pnpm db:seed           # Seed development data
pnpm clean             # Clean build artifacts
```

## Monorepo Structure

```
aether/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # NestJS backend
│   ├── indexer/                # Blockchain indexer
│   └── ai-service/             # FastAPI AI service
├── packages/
│   ├── types/                  # Shared types
│   ├── ui/                     # UI components
│   ├── utils/                  # Utilities
│   ├── auth/                   # Auth utilities
│   └── blockchain/             # Blockchain SDK
├── contracts/                  # Solidity contracts (Foundry)
├── infrastructure/
│   ├── docker/                 # Docker Compose configs
│   ├── nginx/                  # Nginx configuration
│   └── monitoring/             # Observability setup
├── .github/
│   └── workflows/              # CI/CD workflows
├── pnpm-workspace.yaml         # pnpm workspaces config
├── turbo.json                  # Turborepo config
├── tsconfig.json               # Root TypeScript config
├── .eslintrc.json              # ESLint config
└── .prettierrc                 # Prettier config
```

## Key Principles

✓ **No Paid Services** - All tools are free or open-source
✓ **AWS Learner Lab** - Cloud resources from educational account
✓ **Local AI** - Ollama runs locally, no cloud AI services
✓ **Base Sepolia Only** - Testnet for all smart contracts
✓ **PostgreSQL as Source of Truth** - On-chain data mirrors to DB
✓ **Redis for Cache Only** - Never for persistence
✓ **Student Budget Safe** - Zero credit card requirements

## Deployment

- **Local Development**: Docker Compose + Cloudflare Tunnel
- **Frontend Hosting**: Cloudflare Pages (free)
- **API Hosting**: AWS Learner Lab EC2/App Runner
- **Smart Contracts**: Base Sepolia testnet

## Contributing

All code should follow:

- TypeScript strict mode
- ESLint + Prettier formatting
- Small, modular increments
- Production-ready quality

## License

MIT
