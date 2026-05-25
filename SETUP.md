# Aether Monorepo Setup Guide

## Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 9.0.0
- **Docker & Docker Compose**: For containerized services
- **Git**: For version control

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd aether

# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment templates
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/indexer/.env.example apps/indexer/.env.local
cp apps/ai-service/.env.example apps/ai-service/.env.local
cp contracts/.env.example contracts/.env.local

# Update .env.local files with your configuration
# Default development credentials are suitable for local development
```

### 3. Start Docker Services

```bash
# Build Docker images
pnpm run docker:build

# Start Docker containers (PostgreSQL, Redis, Ollama)
pnpm run docker:up

# View logs to confirm services are running
pnpm run docker:logs
```

**Expected output:**

```
aether-postgres is up and running
aether-redis is up and running
aether-ollama is up and running
```

### 4. Initialize Database

```bash
# Run Prisma migrations
pnpm run db:migrate

# Seed database with initial data (optional)
pnpm run db:seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Start all services in parallel
pnpm run dev

# Or start individual services in separate terminals:

# Terminal 1: Frontend
cd apps/web && pnpm dev
# Frontend available at http://localhost:3000

# Terminal 2: Backend API
cd apps/api && pnpm dev
# API available at http://localhost:3001
# WebSocket at ws://localhost:3001

# Terminal 3: Blockchain Indexer
cd apps/indexer && pnpm dev
# Monitors Base Sepolia for events

# Terminal 4: AI Service
cd apps/ai-service && pnpm dev
# AI service available at http://localhost:5000
```

## Common Commands

### Monorepo-wide Tasks

```bash
# Type checking on all workspaces
pnpm run type-check

# Linting all workspaces
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format

# Check formatting without changes
pnpm run format:check

# Run tests on all workspaces
pnpm run test

# Build all workspaces
pnpm run build

# Clean build artifacts
pnpm run clean
```

### Docker Commands

```bash
# Build Docker images
pnpm run docker:build

# Start Docker stack
pnpm run docker:up

# Stop Docker stack
pnpm run docker:down

# View Docker logs
pnpm run docker:logs

# Remove all Docker containers and volumes
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v
```

### Database Commands

```bash
# Run migrations
pnpm run db:migrate

# Generate Prisma client
cd apps/api && pnpm prisma generate

# View database in Prisma Studio
cd apps/api && pnpm prisma studio

# Create a new migration
cd apps/api && pnpm prisma migrate dev --name <migration-name>

# Seed database
pnpm run db:seed
```

### Individual Workspace Commands

```bash
# Frontend
cd apps/web
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Type check

# Backend API
cd apps/api
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Type check

# Indexer
cd apps/indexer
pnpm dev              # Start dev server
pnpm build            # Build
pnpm lint             # Run ESLint

# AI Service
cd apps/ai-service
pnpm dev              # Start dev server
pnpm start            # Start production
```

## Directory-Specific Commands

### Working with Packages

```bash
# Add a dependency to a specific package
pnpm --filter @aether/types add lodash

# Run scripts in a specific package
pnpm --filter @aether/ui run lint

# Remove dependency from package
pnpm --filter @aether/auth remove old-package
```

## Docker Stack Details

### Services

| Service    | Port  | Purpose            | Database |
| ---------- | ----- | ------------------ | -------- |
| PostgreSQL | 5432  | Primary data store | N/A      |
| Redis      | 6379  | Caching & Pub/Sub  | N/A      |
| Ollama     | 11434 | Local AI inference | N/A      |

### Docker Compose Environments

**Development** (`docker-compose.dev.yml`):

- Direct port exposure for debugging
- Simple credentials (aether:aether123)
- Health checks enabled
- Persistent volumes

**Production** (`docker-compose.prod.yml`):

- Environment variable configuration
- Security best practices
- Auto-restart policies
- AOF persistence for Redis

## Verification Steps

### 1. Verify Installation

```bash
# Check pnpm version
pnpm --version

# Check Node version
node --version

# Check Docker
docker --version
docker-compose --version
```

### 2. Verify Monorepo Setup

```bash
# Type check all packages
pnpm run type-check

# Run linting
pnpm run lint

# Expected result: No errors
```

### 3. Verify Docker Services

```bash
# Check Docker containers
docker ps

# Expected output: postgres, redis, ollama containers running

# Test PostgreSQL connection
docker exec aether-postgres pg_isready -U aether

# Test Redis connection
docker exec aether-redis redis-cli ping

# Expected result: PONG
```

### 4. Verify Database

```bash
# Check PostgreSQL connection
cd apps/api && pnpm prisma db push

# View database in Prisma Studio
cd apps/api && pnpm prisma studio
# Open http://localhost:5555 in browser
```

### 5. Verify Frontend Connection

```bash
# Start frontend
cd apps/web && pnpm dev

# Navigate to http://localhost:3000

# Check browser console for API connectivity warnings
```

## Troubleshooting

### pnpm Not Found

```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm prefix (not recommended)
npm exec pnpm install
```

### Docker Port Already in Use

```bash
# Find what's using the port
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis
lsof -i :11434  # Ollama

# Stop Docker services and clear volumes
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v
```

### Database Migration Errors

```bash
# Reset Prisma state
cd apps/api && rm -rf node_modules/.prisma

# Reinstall dependencies
pnpm install

# Try migrations again
pnpm run db:migrate
```

### TypeScript Errors in IDE

```bash
# Ensure all dependencies are installed
pnpm install

# Generate Prisma types
cd apps/api && pnpm prisma generate

# Restart TypeScript server in VS Code
# Command Palette → "TypeScript: Restart TS Server"
```

### Cannot Connect to Ollama

```bash
# Verify Ollama container is running
docker ps | grep ollama

# Check Ollama logs
docker logs aether-ollama

# Manually pull a model
docker exec aether-ollama ollama pull mistral
```

### Turbo Cache Issues

```bash
# Clear Turbo cache
pnpm run clean

# Rebuild everything
pnpm run build

# Or remote cache issues
turbo login  # If using Turborepo Cloud
```

## Production Deployment

### Build for Production

```bash
# Build all workspaces
pnpm run build

# Expected output:
# - apps/web: .next directory
# - apps/api: dist directory
# - apps/indexer: dist directory
# - Smart contracts: compiled artifacts
```

### Docker Production Build

```bash
# Build Docker images for production
docker-compose -f infrastructure/docker/docker-compose.prod.yml build

# Start production stack
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Environment Variables for Production

```bash
# Update .env files with production values
cp infrastructure/docker/.env.example infrastructure/docker/.env.prod.local

# Set secure passwords and API keys
# - POSTGRES_PASSWORD: Use strong password
# - JWT_SECRET: Use cryptographically secure random value
# - PRIVATE_KEY: Set deployed contract owner key
# - PINATA_API_KEY: Set for IPFS pinning (optional)
```

## Development Tips

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/chat-messaging

# Make changes across multiple packages
# Commit atomically
git add apps/api/src/chat/ packages/types/src/chat.ts
git commit -m "feat(chat): add message persistence"

# Push and create PR
git push origin feature/chat-messaging
```

### Adding Dependencies

```bash
# Add to workspace root (devDependencies)
pnpm add -w -D typescript

# Add to specific package
pnpm --filter @aether/api add class-validator

# Add to multiple packages
pnpm --filter @aether/ui --filter @aether/web add react-hook-form
```

### Creating New Packages

```bash
# Create new package structure
mkdir -p packages/new-package/src

# Create package.json
cat > packages/new-package/package.json << 'EOF'
{
  "name": "@aether/new-package",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

# Create tsconfig.json
cp packages/types/tsconfig.json packages/new-package/

# Create index.ts
echo 'export {};' > packages/new-package/src/index.ts

# Install
pnpm install
```

### Code Quality

```bash
# Pre-commit checks (recommended to add as pre-commit hook)
pnpm run lint:fix
pnpm run format
pnpm run type-check

# Run before committing
git add .
git commit -m "your commit message"
```

## Next Steps

1. **Read MONOREPO_STRUCTURE.md** for detailed architecture
2. **Review app-specific READMEs** in each apps/ directory
3. **Check GitHub workflows** for CI/CD configuration
4. **Review smart contracts** in contracts/src/
5. **Set up environment variables** for your development machine

## Additional Resources

- [pnpm Documentation](https://pnpm.io/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [wagmi Documentation](https://wagmi.sh/)
- [Ollama Documentation](https://github.com/ollama/ollama)

## Support

For issues or questions:

1. Check GitHub Issues
2. Review this guide's troubleshooting section
3. Check individual package documentation
4. Create an issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, pnpm version)
   - Docker version

---

**Last Updated**: May 2024  
**Aether Monorepo Version**: 0.1.0
