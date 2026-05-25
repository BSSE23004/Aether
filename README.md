# Aether - Production-Style Web3 Collaboration Platform

A modern, student-friendly Web3 collaboration platform combining wallet-based authentication, real-time chat, DAO governance, and decentralized file storage. Built with free/open-source tools and designed for the Base Sepolia testnet.

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url> && cd aether

# Install dependencies (requires pnpm >= 9.0.0)
pnpm install

# Setup environment
cp .env.example .env.local

# Start Docker services
pnpm run docker:up

# Verify all services are running
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

# Initialize database
pnpm run db:migrate

# Start development servers
pnpm run dev
```

Frontend: http://localhost:3000  
API: http://localhost:3001  
AI Service: http://localhost:5000

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup and troubleshooting guide
- **[MONOREPO_STRUCTURE.md](./MONOREPO_STRUCTURE.md)** - Architecture, directory structure, and design decisions
- **[apps/web/README.md](./apps/web/README.md)** - Frontend documentation
- **[apps/api/README.md](./apps/api/README.md)** - Backend API documentation
- **[contracts/README.md](./contracts/README.md)** - Smart contracts documentation

## 🏗️ Architecture

Hybrid Web3 architecture with on-chain governance and off-chain data storage:

```
Frontend (Next.js)
    ↓
Backend API (NestJS) ← → Blockchain Indexer
    ↓                       ↓
PostgreSQL + Redis ← → Base Sepolia Contracts
    ↓
IPFS / Local AI (Ollama)
```

### 📱 Apps (Full Applications)

| App            | Purpose             | Tech Stack                                   |
| -------------- | ------------------- | -------------------------------------------- |
| **web**        | Frontend UI         | Next.js 14 + React 18 + Tailwind + shadcn/ui |
| **api**        | Backend services    | NestJS + Prisma + PostgreSQL + Redis         |
| **indexer**    | Blockchain listener | viem + Prisma + Redis                        |
| **ai-service** | AI inference        | FastAPI + Ollama (local models)              |

### 📦 Packages (Shared Libraries)

| Package        | Purpose                   | Type    |
| -------------- | ------------------------- | ------- |
| **types**      | Shared TypeScript types   | Library |
| **ui**         | Reusable React components | Library |
| **blockchain** | Contract ABIs & SDK       | Library |
| **auth**       | Wallet signing utilities  | Library |
| **utils**      | Helper functions          | Library |

### 🔗 Smart Contracts

| Contract              | Purpose                       |
| --------------------- | ----------------------------- |
| **CommunityRegistry** | DAO community registry        |
| **GovernanceToken**   | ERC-20 governance token       |
| **Proposals**         | Governance proposals & voting |
| **Treasury**          | Community treasury management |
| **MembershipNFT**     | Token-gated access (ERC-721)  |

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 + shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Web3**: wagmi + viem + RainbowKit
- **Forms**: React Hook Form

### Backend

- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Real-time**: Socket.IO
- **Validation**: class-validator

### Blockchain

- **Language**: Solidity 0.8.20
- **Framework**: Foundry
- **Standards**: OpenZeppelin v4.9.3
- **Network**: Base Sepolia Testnet
- **Interaction**: viem + ethers.js

### Infrastructure

- **Monorepo**: pnpm workspaces + Turborepo
- **Containerization**: Docker & Docker Compose
- **Code Quality**: ESLint + Prettier
- **TypeScript**: Strict mode across all packages
- **CI/CD**: GitHub Actions (placeholder)

## 📋 Requirements & Constraints

✅ **No paid APIs** - Fully open-source stack  
✅ **No credit cards** - Free tier only  
✅ **AWS Learner Lab compatible** - EC2-based infrastructure  
✅ **Local AI inference** - Ollama for model serving  
✅ **Testnet only** - Base Sepolia (no mainnet)  
✅ **Student-friendly** - Clear documentation and examples

## 🚦 Development Commands

### Monorepo-wide

```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint && pnpm run lint:fix

# Formatting
pnpm run format

# Testing
pnpm run test

# Building
pnpm run build

# Database
pnpm run db:migrate    # Run migrations
pnpm run db:seed       # Seed data
```

### Docker Services

```bash
# Start services
pnpm run docker:up

# View logs
pnpm run docker:logs

# Stop services
pnpm run docker:down

# Full reset
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v
```

### Individual Apps

```bash
cd apps/web && pnpm dev        # Frontend
cd apps/api && pnpm dev        # Backend API
cd apps/indexer && pnpm dev    # Indexer
cd apps/ai-service && pnpm dev # AI Service
```

## 📁 Project Structure

```
aether/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/              # NestJS backend
│   ├── indexer/          # Blockchain indexer
│   └── ai-service/       # FastAPI + Ollama
├── packages/
│   ├── types/            # TypeScript types
│   ├── ui/               # UI components
│   ├── blockchain/       # Web3 utilities
│   ├── auth/             # Auth utilities
│   └── utils/            # Helper functions
├── contracts/            # Solidity contracts (Foundry)
├── infrastructure/       # Docker, Nginx, monitoring
├── .github/              # CI/CD workflows
├── SETUP.md              # Setup guide
├── MONOREPO_STRUCTURE.md # Architecture documentation
└── turbo.json            # Turborepo configuration
```

See [MONOREPO_STRUCTURE.md](./MONOREPO_STRUCTURE.md) for complete directory tree.

## 🔐 Environment Variables

All environment variables are configured via `.env.local` files:

- **Root**: `.env.example` → `.env.local`
- **Frontend**: `apps/web/.env.example` → `apps/web/.env.local`
- **Backend**: `apps/api/.env.example` → `apps/api/.env.local`
- **Indexer**: `apps/indexer/.env.example` → `apps/indexer/.env.local`
- **AI Service**: `apps/ai-service/.env.example` → `apps/ai-service/.env.local`
- **Contracts**: `contracts/.env.example` → `contracts/.env.local`
- **Docker**: `infrastructure/docker/.env.example` → `infrastructure/docker/.env.local`

## 🐳 Docker Services

### Development Stack

Automatically runs:

- **PostgreSQL 16**: Primary database (port 5432)
- **Redis 7**: Caching & pub/sub (port 6379)
- **Ollama**: Local AI inference (port 11434)

```bash
pnpm run docker:up
```

### Production Considerations

- Use environment variables for credentials
- Configure persistent volumes
- Set up monitoring and logging
- Use AWS Learner Lab EC2 instances
- Cloudflare Tunnel for secure connectivity

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/description

# Make changes
# Commit atomically
git commit -m "feat(module): description"

# Push
git push origin feature/description

# Create Pull Request
# Get reviewed and merge to main
```

## 🐛 Troubleshooting

See [SETUP.md - Troubleshooting](./SETUP.md#troubleshooting) for common issues and solutions.

## 📝 Code Quality

- **Linting**: ESLint + TypeScript
- **Formatting**: Prettier
- **Type Safety**: TypeScript strict mode
- **Pre-commit**: Git hooks (configure with husky)

```bash
# Check code quality
pnpm run lint
pnpm run format:check
pnpm run type-check
```

## 🚀 Deployment

### Local Development

```bash
pnpm install
pnpm run docker:up
pnpm run db:migrate
pnpm run dev
```

### Production Build

```bash
pnpm run build
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

See [SETUP.md - Production Deployment](./SETUP.md#production-deployment) for details.

## 📖 Learning Resources

- [Monorepo Architecture](./MONOREPO_STRUCTURE.md) - Design decisions and rationale
- [Setup Guide](./SETUP.md) - Complete setup and troubleshooting
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Foundry Book](https://book.getfoundry.sh/)
- [wagmi Docs](https://wagmi.sh/)

## 🤝 Contributing

1. Follow the [Git Workflow](#git-workflow)
2. Run `pnpm lint:fix` before committing
3. Write descriptive commit messages
4. Test your changes locally
5. Create a PR with a clear description

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

## 🎯 Project Status

- **Version**: 0.1.0
- **Status**: Active Development
- **Last Updated**: May 2024

---

**Aether** - Building the future of Web3 collaboration, one block at a time.

For questions or issues, please open a GitHub issue or check the [documentation](./MONOREPO_STRUCTURE.md).

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
