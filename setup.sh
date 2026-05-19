#!/bin/bash
set -e

echo "🚀 Aether Monorepo Setup"
echo "========================"

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Visit: https://docs.docker.com/install"
    exit 1
fi

echo "✓ Prerequisites OK"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo ""
echo "🔧 Setting up environment files..."

for app in apps/web apps/api apps/indexer apps/ai-service contracts infrastructure/docker; do
    if [ -f "$app/.env.example" ]; then
        if [ ! -f "$app/.env.local" ]; then
            cp "$app/.env.example" "$app/.env.local"
            echo "✓ Created $app/.env.local"
        fi
    fi
done

# Start Docker services
echo ""
echo "🐳 Starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review .env.local files in each app"
echo "  2. Run: pnpm dev"
echo "  3. Visit: http://localhost:3000"
