# Aether Monorepo Structure & Architecture

## 📁 Complete Folder Tree

```
aether/
├── .eslintrc.json                    # Root ESLint configuration
├── .env.example                      # Environment variables template
├── .github/                          # GitHub workflows
├── .gitignore                        # Git ignore rules
├── .prettierignore                   # Prettier ignore rules
├── .prettierrc                       # Prettier formatting config
├── .turbo/                           # Turbo cache (auto-generated)
├── LICENSE                           # MIT License
├── README.md                         # Root readme
├── package.json                      # Root workspace package
├── pnpm-lock.yaml                    # pnpm lock file
├── pnpm-workspace.yaml               # pnpm workspaces config
├── setup.sh                          # Setup script
├── tsconfig.json                     # Root TypeScript config (extends to all)
├── turbo.json                        # Turborepo configuration
│
├── apps/                             # Full-stack applications
│   ├── web/                          # Frontend - Next.js + Web3
│   │   ├── .env.example              # Frontend env vars
│   │   ├── .env.local                # Local overrides (gitignored)
│   │   ├── app/                      # Next.js app directory
│   │   ├── package.json              # Web app dependencies
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities & helpers
│   │   │   ├── pages/                # Next.js pages (if using pages router)
│   │   │   └── styles/               # CSS/Tailwind
│   │   ├── tsconfig.json             # Next.js TypeScript config
│   │   └── next.config.js            # Next.js configuration
│   │
│   ├── api/                          # Backend - NestJS + Prisma
│   │   ├── .env.example              # Backend env vars
│   │   ├── .env.local                # Local overrides (gitignored)
│   │   ├── dist/                     # Compiled JavaScript
│   │   ├── package.json              # Backend dependencies
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   └── migrations/           # Database migrations
│   │   ├── src/
│   │   │   ├── main.ts               # NestJS entry point
│   │   │   ├── auth/                 # Authentication module
│   │   │   ├── chat/                 # Chat module (Socket.IO)
│   │   │   ├── governance/           # DAO governance module
│   │   │   ├── database/             # Prisma service
│   │   │   ├── cache/                # Redis cache service
│   │   │   └── common/               # Shared utilities
│   │   ├── tsconfig.json             # NestJS TypeScript config
│   │   └── nest-cli.json             # NestJS CLI config
│   │
│   ├── indexer/                      # Blockchain Indexer
│   │   ├── .env.example              # Indexer env vars
│   │   ├── .env.local                # Local overrides (gitignored)
│   │   ├── dist/                     # Compiled JavaScript
│   │   ├── package.json              # Indexer dependencies
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point
│   │   │   ├── services/             # Core services
│   │   │   ├── types/                # Type definitions
│   │   │   └── utils/                # Utilities
│   │   └── tsconfig.json             # Indexer TypeScript config
│   │
│   └── ai-service/                   # AI Service - FastAPI + Ollama
│       ├── .env.example              # AI service env vars
│       ├── .env.local                # Local overrides (gitignored)
│       ├── src/
│       │   ├── main.py               # FastAPI entry point
│       │   ├── models/               # ML models
│       │   ├── routes/               # API endpoints
│       │   ├── services/             # Business logic
│       │   └── utils/                # Utilities
│       ├── requirements.txt          # Python dependencies
│       ├── Dockerfile                # Python container
│       └── package.json              # npm wrapper (for monorepo)
│
├── packages/                         # Shared packages (libraries)
│   ├── types/                        # TypeScript type definitions
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts              # Main exports
│   │   │   ├── api.ts                # API response types
│   │   │   ├── blockchain.ts         # Blockchain types
│   │   │   ├── entities.ts           # Domain entity types
│   │   │   └── errors.ts             # Custom error types
│   │   └── tsconfig.json
│   │
│   ├── ui/                           # Shared UI Components
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts              # Component exports
│   │   │   ├── components/           # shadcn/ui components
│   │   │   ├── hooks/                # Custom UI hooks
│   │   │   ├── styles/               # Shared styles
│   │   │   └── themes/               # Theme configurations
│   │   └── tsconfig.json
│   │
│   ├── blockchain/                   # Blockchain Utilities & ABIs
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts              # Main exports
│   │   │   ├── abi/                  # Smart contract ABIs
│   │   │   ├── contracts/            # Contract address registry
│   │   │   ├── sdk/                  # Contract interaction SDK
│   │   │   └── utils/                # Web3 utilities
│   │   └── tsconfig.json
│   │
│   ├── auth/                         # Authentication Utilities
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts              # Main exports
│   │   │   ├── wallet/               # Wallet signing logic
│   │   │   ├── jwt/                  # JWT utilities
│   │   │   ├── middleware/           # Express/NestJS middleware
│   │   │   └── validators/           # Auth validators
│   │   └── tsconfig.json
│   │
│   └── utils/                        # Shared Utilities
│       ├── package.json
│       ├── src/
│       │   ├── index.ts              # Main exports
│       │   ├── validators/           # Data validators
│       │   ├── formatters/           # Data formatters
│       │   ├── constants/            # Global constants
│       │   └── helpers/              # Helper functions
│       └── tsconfig.json
│
├── contracts/                        # Smart Contracts
│   ├── .env.example                  # Contract deployment env vars
│   ├── .env.local                    # Local overrides (gitignored)
│   ├── foundry.toml                  # Foundry configuration
│   ├── package.json                  # Dependencies (OpenZeppelin, etc)
│   ├── src/
│   │   ├── CommunityRegistry.sol     # Community DAO registry
│   │   ├── GovernanceToken.sol       # DAO governance token
│   │   ├── Proposals.sol             # Governance proposals
│   │   ├── Treasury.sol              # Community treasury
│   │   ├── MembershipNFT.sol         # NFT membership
│   │   └── interfaces/               # Interface definitions
│   ├── test/                         # Foundry tests
│   ├── script/                       # Deployment scripts
│   └── lib/                          # OpenZeppelin & other libraries
│
├── infrastructure/                   # Infrastructure & DevOps
│   ├── docker/
│   │   ├── .env.example              # Docker env vars
│   │   ├── .env.local                # Local overrides (gitignored)
│   │   ├── docker-compose.dev.yml    # Development stack
│   │   ├── docker-compose.prod.yml   # Production stack
│   │   ├── Dockerfile.api            # NestJS container
│   │   ├── Dockerfile.indexer        # Indexer container
│   │   └── Dockerfile.web            # Next.js container
│   │
│   ├── nginx/
│   │   ├── nginx.conf                # Nginx reverse proxy config
│   │   └── ssl/                      # SSL certificates (for prod)
│   │
│   ├── cloudflared/
│   │   └── config.yaml               # Cloudflare Tunnel config
│   │
│   └── monitoring/
│       ├── prometheus.yml            # Prometheus config
│       └── grafana/                  # Grafana dashboards
│
└── .github/
    └── workflows/
        ├── lint.yml                  # Linting workflow
        ├── test.yml                  # Testing workflow
        ├── build.yml                 # Build workflow
        └── deploy.yml                # Deployment workflow
```

## 🏗️ Architecture Overview

### Monorepo Strategy: pnpm Workspaces + Turborepo

**Why this approach:**

- **pnpm workspaces**: Efficient dependency deduplication, isolated node_modules
- **Turborepo**: Intelligent build caching, parallel task execution, remote caching support
- **Single source of truth**: Root `tsconfig.json` extends to all workspaces
- **Shared tooling**: ESLint, Prettier, TypeScript configurations inherited by all packages

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│  apps/web (Next.js + React + Web3 Wallet Integration)      │
│  • TanStack Query for data fetching                         │
│  • Zustand for state management                             │
│  • Tailwind + shadcn/ui for styling                         │
│  • wagmi + viem for Web3 interactions                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API & SERVICES LAYER                      │
│  apps/api (NestJS + Prisma + PostgreSQL + Redis)           │
│  • Socket.IO for realtime chat                             │
│  • Prisma ORM for database access                          │
│  • Redis for caching & pub/sub                             │
│                                                             │
│  apps/indexer (Viem + PostgreSQL + Redis)                  │
│  • Blockchain event listener                               │
│  • Event mirror to off-chain database                      │
│                                                             │
│  apps/ai-service (FastAPI + Ollama)                        │
│  • Local AI inference only                                 │
│  • Mistral/Llama models via Ollama                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                     │
│  PostgreSQL: Source of truth (users, messages, metadata)   │
│  Redis: Caching & real-time pub/sub                        │
│  IPFS: Decentralized file storage                          │
│  Ollama: Local AI model inference                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                          │
│  Base Sepolia (Testnet) - Smart Contracts via Foundry      │
│  • Community registry                                       │
│  • Governance proposals & voting                           │
│  • Treasury management                                      │
│  • Membership NFTs                                          │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Package Dependencies

### Frontend (apps/web)

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Data**: TanStack Query (React Query)
- **Web3**: wagmi + viem + RainbowKit
- **Forms**: React Hook Form

### Backend (apps/api)

- **Framework**: NestJS
- **Database**: Prisma + PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Real-time**: Socket.IO
- **Validation**: class-validator + class-transformer

### Indexer (apps/indexer)

- **Blockchain**: viem
- **Database**: Prisma
- **Cache**: Redis
- **Runtime**: Node.js with ts-node-dev

### AI Service (apps/ai-service)

- **Framework**: FastAPI
- **AI Runtime**: Ollama (local inference)
- **Dependencies**: FastAPI, httpx, pydantic

### Shared Packages

- **types**: TypeScript interfaces & types
- **ui**: shadcn/ui components library
- **blockchain**: Contract ABIs, SDK, utilities
- **auth**: Wallet signing, JWT utilities
- **utils**: Validators, formatters, constants

### Smart Contracts

- **Framework**: Foundry (Solidity)
- **Standard**: OpenZeppelin v4.9.3
- **Network**: Base Sepolia (Testnet)

## 🔧 Development Workflow

### Setup

```bash
# Install dependencies (pnpm required)
pnpm install

# Install pnpm globally if needed
npm install -g pnpm

# Run type checking on all workspaces
pnpm run type-check

# Run linting on all workspaces
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

### Development

```bash
# Start all development servers in parallel
pnpm run dev

# Or start individual services
cd apps/web && pnpm dev        # Frontend on http://localhost:3000
cd apps/api && pnpm dev        # API on http://localhost:3001
cd apps/indexer && pnpm dev    # Indexer
cd apps/ai-service && pnpm dev # AI on http://localhost:5000
```

### Docker Development

```bash
# Build Docker images
pnpm run docker:build

# Start Docker stack (PostgreSQL, Redis, Ollama)
pnpm run docker:up

# View logs
pnpm run docker:logs

# Stop Docker stack
pnpm run docker:down
```

### Building

```bash
# Build all packages with Turborepo caching
pnpm run build

# Build specific workspace
cd apps/web && pnpm build
```

### Database

```bash
# Run Prisma migrations
pnpm run db:migrate

# Seed database with initial data
pnpm run db:seed
```

## 🔐 Environment Variables

All environment variables should be defined in `.env.local` files for local development:

- **Root**: `.env.example` → `.env.local`
- **Frontend**: `apps/web/.env.example` → `apps/web/.env.local`
- **API**: `apps/api/.env.example` → `apps/api/.env.local`
- **Indexer**: `apps/indexer/.env.example` → `apps/indexer/.env.local`
- **AI Service**: `apps/ai-service/.env.example` → `apps/ai-service/.env.local`
- **Contracts**: `contracts/.env.example` → `contracts/.env.local`
- **Docker**: `infrastructure/docker/.env.example` → `infrastructure/docker/.env.local`

## 📊 Turbo Configuration (turbo.json)

- **build**: Cache enabled, depends on `^build` (transitive)
- **dev**: Cache disabled, persistent task
- **lint**: Cache enabled
- **type-check**: Cache enabled, depends on `^build`
- **test**: Cache enabled, outputs coverage
- **db:migrate**: Cache disabled (DB operations)
- **db:seed**: Cache disabled, depends on db:migrate

## 🔄 Key Architectural Decisions

### 1. **Monorepo over Multirepo**

- Single source of truth for types and shared code
- Atomic commits across apps
- Easier refactoring and dependency management
- Simplified deployment and versioning

### 2. **PostgreSQL as Source of Truth**

- All user state, messages, and metadata stored off-chain
- Redis only for caching and pub/sub
- Blockchain for governance and authorization only
- Reduces on-chain costs

### 3. **Event-Driven Architecture**

- Blockchain events mirrored to PostgreSQL by indexer
- Socket.IO for real-time chat and notifications
- Redis pub/sub for inter-service communication
- Decoupled services that scale independently

### 4. **Local AI (Ollama)**

- No paid AI APIs (cost constraint)
- Mistral or Llama models run locally
- Isolated ai-service for easy replacement/updates
- Optional feature (doesn't block other services)

### 5. **Base Sepolia Testnet Only**

- Free testing, no gas costs for dev
- Community-supported test faucets
- Lower barrier to student developers
- Easy migration path to mainnet later

### 6. **Docker Compose for Local Development**

- PostgreSQL, Redis, Ollama all in containers
- Volume persistence between runs
- Health checks for service readiness
- Production-like environment locally

### 7. **TypeScript Everywhere**

- Type safety across frontend, backend, contracts
- Shared type definitions in @aether/types
- Reduced bugs, better IDE support
- Improved developer experience

## 🚀 Deployment Strategy

### Local Development

- Docker Compose with dev configuration
- Hot reload on all services
- Seeded test data

### Production

- Docker containers for all services
- Cloudflare Tunnel for secure connectivity
- PostgreSQL & Redis on AWS Learner Lab (EC2)
- Next.js on Cloudflare Pages
- Smart contracts on Base Sepolia

## 📝 Naming Conventions

- **Packages**: `@aether/<package-name>`
- **Branches**: `feature/`, `fix/`, `docs/`, `refactor/`
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)
- **Components**: PascalCase
- **Utils**: camelCase
- **Constants**: UPPER_SNAKE_CASE

## 🔗 Path Aliases (tsconfig.json)

```json
{
  "@/*": ["./*"],
  "@aether/types": ["packages/types/src"],
  "@aether/ui": ["packages/ui/src"],
  "@aether/utils": ["packages/utils/src"],
  "@aether/auth": ["packages/auth/src"],
  "@aether/blockchain": ["packages/blockchain/src"]
}
```

Usage in code:

```typescript
import type { ChatMessage } from '@aether/types';
import { Button } from '@aether/ui';
import { formatDate } from '@aether/utils';
import { signMessage } from '@aether/auth';
import { contractABI } from '@aether/blockchain';
```

## ✅ Verification Checklist

- [ ] All workspaces have `package.json` with correct scripts
- [ ] All TypeScript configs extend from root `tsconfig.json`
- [ ] ESLint and Prettier configs applied to all workspaces
- [ ] Docker Compose files configured for dev and prod
- [ ] `.env.example` files exist for all apps
- [ ] Path aliases working in all workspaces
- [ ] Build cache working (Turbo)
- [ ] Docker images build successfully
- [ ] Database migrations run successfully
- [ ] All services start without errors

---

**Generated**: May 2024  
**Aether**: Production-style Web3 collaboration platform for students
