# Aether Docker Infrastructure Guide

## 🐳 Overview

Complete Docker infrastructure for Aether with development and production configurations. All services (PostgreSQL, Redis, Ollama) are containerized for consistency and portability.

---

## 📋 Services

### PostgreSQL 16 - Primary Database

- **Role**: Source of truth for all user data, messages, profiles
- **Port**: 5432
- **Image**: `postgres:16-alpine`
- **Volume**: `postgres_data` - Persistent data across restarts
- **Development Credentials**: `aether:aether123`
- **Health Check**: `pg_isready` every 10s

**Key Features:**

- ACID compliance for transactional integrity
- Automatic backups via WAL
- Connection pooling support
- Full-text search capability

### Redis 7 - Cache & Pub/Sub

- **Role**: Real-time messaging, caching, session storage
- **Port**: 6379
- **Image**: `redis:7-alpine`
- **Volume**: `redis_data` - RDB snapshots
- **Development**: No persistence (fast, non-critical data)
- **Production**: AOF enabled for durability
- **Health Check**: `redis-cli ping` every 10s

**Key Features:**

- Sub/pub for real-time chat
- LRU eviction for memory management
- Multiple database support (16 databases)
- Transactions for atomic operations

### Ollama - Local AI Inference

- **Role**: Run LLM models locally without paid APIs (optional)
- **Port**: 11434
- **Image**: `ollama/ollama:latest`
- **Volume**: `ollama_data` - Model storage (can be 5-20GB)
- **Models**: Mistral, Neural-Chat, Llama2 available
- **Health Check**: HTTP health endpoint every 30s

**Key Features:**

- Local inference (no data leaves your infrastructure)
- Multiple model support
- GPU acceleration if available
- Completely optional (can disable if not needed)

---

## 🚀 Quick Start

### 1. Initialize Infrastructure

```bash
# Create data directories
./infrastructure/docker/startup.sh init

# Or manually:
mkdir -p data/{postgres,redis,ollama}
```

### 2. Start Services

```bash
# Start all services
./infrastructure/docker/startup.sh up

# Or using docker-compose directly:
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d

# View status
docker-compose ps
```

**Expected output:**

```
NAME                 STATUS
aether-postgres      Up (healthy)
aether-redis         Up (healthy)
aether-ollama        Up (healthy)
```

### 3. Verify Health

```bash
./infrastructure/docker/startup.sh health

# Or manually:
# PostgreSQL
docker exec aether-postgres pg_isready -U aether

# Redis
docker exec aether-redis redis-cli ping

# Ollama
curl http://localhost:11434/api/tags
```

### 4. View Logs

```bash
# All services
./infrastructure/docker/startup.sh logs

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f ollama
```

### 5. Stop Services

```bash
./infrastructure/docker/startup.sh down

# Or:
docker-compose down
```

---

## 🛠️ Management Commands

### Using Startup Script

```bash
# Initialize
./infrastructure/docker/startup.sh init

# Start stack
./infrastructure/docker/startup.sh up

# Stop stack
./infrastructure/docker/startup.sh down

# View logs
./infrastructure/docker/startup.sh logs

# Check health
./infrastructure/docker/startup.sh health

# Pull AI models
./infrastructure/docker/startup.sh pull-models

# Restart stack
./infrastructure/docker/startup.sh restart

# Reset everything (WARNING: Data loss!)
./infrastructure/docker/startup.sh reset

# Build Docker images
./infrastructure/docker/startup.sh build
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

# View status
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

# View logs
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.dev.yml down

# Remove volumes (reset data)
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v

# Enter container shell
docker-compose -f infrastructure/docker/docker-compose.dev.yml exec postgres bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml exec redis sh
docker-compose -f infrastructure/docker/docker-compose.dev.yml exec ollama bash
```

---

## 📊 Connection Details

### Development

| Service    | Host      | Port  | Connection String                                         |
| ---------- | --------- | ----- | --------------------------------------------------------- |
| PostgreSQL | localhost | 5432  | `postgresql://aether:aether123@localhost:5432/aether_dev` |
| Redis      | localhost | 6379  | `redis://localhost:6379`                                  |
| Ollama     | localhost | 11434 | `http://localhost:11434`                                  |

### Docker Internal (service-to-service)

| Service    | Host     | Port  | Connection String                                        |
| ---------- | -------- | ----- | -------------------------------------------------------- |
| PostgreSQL | postgres | 5432  | `postgresql://aether:aether123@postgres:5432/aether_dev` |
| Redis      | redis    | 6379  | `redis://redis:6379`                                     |
| Ollama     | ollama   | 11434 | `http://ollama:11434`                                    |

**Note**: Use internal hostnames when connecting from other containers.

---

## 🗄️ PostgreSQL Management

### Connect to Database

```bash
# Using psql
docker-compose exec postgres psql -U aether -d aether_dev

# Using Docker
docker exec -it aether-postgres psql -U aether -d aether_dev
```

### View Database

```bash
# List databases
docker-compose exec postgres psql -U aether -l

# Connect to database
docker-compose exec postgres psql -U aether -d aether_dev -c "\dt"
```

### Run Migrations

```bash
# From project root
pnpm run db:migrate

# Or directly with Prisma
cd apps/api
pnpm prisma migrate deploy

# View migration status
pnpm prisma migrate status
```

### Backup Database

```bash
# Backup to file
docker-compose exec postgres pg_dump -U aether aether_dev > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U aether aether_dev < backup.sql

# Backup as compressed archive
docker-compose exec postgres pg_dump -U aether -F custom aether_dev > backup.dump
```

---

## ⚡ Redis Management

### Connect to Redis

```bash
# Using redis-cli
docker-compose exec redis redis-cli

# Or:
redis-cli -h localhost -p 6379
```

### Common Commands

```bash
# Connect and ping
redis-cli ping
# Response: PONG

# Set/Get value
SET mykey "Hello"
GET mykey

# View all keys
KEYS *

# Get memory usage
INFO memory

# Clear database
FLUSHDB  # Current database
FLUSHALL # All databases
```

### Monitor Real-time

```bash
# Watch all commands in real-time
docker-compose exec redis redis-cli monitor

# View statistics
docker-compose exec redis redis-cli INFO
```

---

## 🤖 Ollama Model Management

### Pull Models

```bash
# Pull specific model
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull neural-chat

# Or use startup script
./infrastructure/docker/startup.sh pull-models
```

### List Installed Models

```bash
docker-compose exec ollama ollama list
```

### API Endpoints

```bash
# List available models
curl http://localhost:11434/api/tags

# Generate text
curl -X POST http://localhost:11434/api/generate \
  -d '{
    "model": "mistral",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'

# Show model info
curl http://localhost:11434/api/show -d '{"name": "mistral"}'
```

### Integrate with Backend

```typescript
// apps/ai-service/src/services/ollama.ts
import axios from 'axios';

const OLLAMA_API = process.env.OLLAMA_HOST || 'http://ollama:11434';

export async function generateText(prompt: string) {
  const response = await axios.post(`${OLLAMA_API}/api/generate`, {
    model: process.env.OLLAMA_MODEL || 'mistral',
    prompt,
    stream: false,
  });
  return response.data.response;
}
```

---

## 📁 Data Persistence

### Development Stack

Data directories are created on first run:

```
data/
├── postgres/          # PostgreSQL data files (~100MB-1GB)
├── redis/             # Redis RDB snapshots (~10-100MB)
└── ollama/            # AI models (~5-20GB per model)
```

### Volume Locations

**Development** (docker-compose.dev.yml):

```yaml
postgres_data:
  device: ${PWD}/data/postgres
redis_data:
  device: ${PWD}/data/redis
ollama_data:
  device: ${PWD}/data/ollama
```

**Production** (docker-compose.prod.yml):

```yaml
postgres_data:
  device: /data/aether/postgres
redis_data:
  device: /data/aether/redis
ollama_data:
  device: /data/aether/ollama
```

### Backup & Recovery

```bash
# Backup entire PostgreSQL data directory
cp -r data/postgres data/postgres.backup

# List backups
ls -lh data/

# Restore from backup
rm -rf data/postgres
cp -r data/postgres.backup data/postgres

# Clean backup
rm -rf data/postgres.backup
```

---

## 🏥 Health Checks

### Automatic Monitoring

All services have configured health checks:

```bash
# View health status
docker-compose ps

# Detailed health info
docker inspect aether-postgres | grep -A 10 "Health"
```

### Manual Health Checks

```bash
# PostgreSQL
docker-compose exec postgres pg_isready -U aether -h localhost
# Response: accepting connections

# Redis
docker-compose exec redis redis-cli ping
# Response: PONG

# Ollama
curl -s http://localhost:11434/api/tags | jq .
# Should return model list
```

### Health Check Configuration

Each service has a `healthcheck` configuration:

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U aether']
  interval: 10s # Check every 10s
  timeout: 5s # Wait max 5s for response
  retries: 5 # Fail after 5 failed checks
  start_period: 10s # Give service 10s to start
```

---

## 🔧 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs postgres

# Check Docker daemon
docker ps
docker images
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis
lsof -i :11434  # Ollama

# Kill process and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection manually
docker-compose exec postgres psql -U aether -d aether_dev -c "SELECT 1"

# Verify environment variables
docker-compose exec postgres printenv | grep POSTGRES
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Reduce Redis memory
# In docker-compose.dev.yml:
command: redis-server --maxmemory 128mb

# Disable Ollama if not needed
# Comment out ollama service in docker-compose.yml
```

### Ollama Models Won't Download

```bash
# Check Ollama service
docker-compose logs ollama

# Verify internet connection
docker-compose exec ollama ping 8.8.8.8

# Try smaller model
docker-compose exec ollama ollama pull neural-chat
```

---

## 🚀 Production Deployment

### Environment Configuration

```bash
# Copy prod template
cp infrastructure/docker/.env.example infrastructure/docker/.env.prod

# Edit with secure values
nano infrastructure/docker/.env.prod
```

Required variables:

```env
POSTGRES_USER=aether_prod
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=aether_prod
```

### Start Production Stack

```bash
# Using prod compose file
docker-compose -f infrastructure/docker/docker-compose.prod.yml \
  --env-file infrastructure/docker/.env.prod \
  up -d

# Verify
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps

# Check health
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec postgres \
  pg_isready -U ${POSTGRES_USER}
```

### Backup Strategy

```bash
#!/bin/bash
# Daily PostgreSQL backup

BACKUP_DIR="/backups/aether"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} \
  | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Backup Redis
docker-compose exec -T redis redis-cli BGSAVE

cp data/redis/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Keep last 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

---

## 📊 Performance Tuning

### PostgreSQL

For development (already configured in docker-compose.dev.yml):

```env
POSTGRES_INITDB_ARGS='-c shared_buffers=256MB -c effective_cache_size=512MB'
```

For production, increase buffers:

```env
POSTGRES_INITDB_ARGS='-c shared_buffers=512MB -c effective_cache_size=2GB'
```

### Redis

Development:

```
--maxmemory 256mb --maxmemory-policy allkeys-lru
```

Production:

```
--maxmemory 1gb --maxmemory-policy allkeys-lru
```

### Ollama

For GPU acceleration (if available):

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

---

## 🧹 Cleanup

### Remove Containers Only

```bash
# Stop and remove containers (keep volumes)
docker-compose down

# Remove specific container
docker-compose rm postgres
```

### Remove All (WARNING: Data Loss)

```bash
# Remove containers and volumes
docker-compose down -v

# Or use startup script
./infrastructure/docker/startup.sh reset
```

### Clean Up Unused Resources

```bash
# Remove unused images
docker image prune

# Remove dangling volumes
docker volume prune

# Remove all stopped containers
docker container prune
```

---

## 📚 Docker Best Practices

✅ **Always use specific image versions** (not `latest`)  
✅ **Use named volumes** for persistent data  
✅ **Implement health checks** for all services  
✅ **Run containers as non-root users**  
✅ **Use `.dockerignore`** to reduce image size  
✅ **Multi-stage builds** for smaller production images  
✅ **Set memory limits** to prevent OOM issues  
✅ **Use bridge networks** for service isolation  
✅ **Mount volumes** for development hot-reload

---

## 🔗 Related Documentation

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [SETUP.md](../../../SETUP.md) - Main setup guide
- [MONOREPO_STRUCTURE.md](../../../MONOREPO_STRUCTURE.md) - Architecture overview

---

## 📞 Support

For issues with Docker infrastructure:

1. Check logs: `docker-compose logs [service]`
2. Verify health: `./startup.sh health`
3. Review troubleshooting section above
4. Check service-specific documentation
5. Open GitHub issue with logs and environment details

---

**Last Updated**: May 2024  
**Aether Docker Infrastructure v1.0**
