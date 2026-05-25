#!/bin/bash

################################################################################
# Aether Docker Infrastructure Startup Script
################################################################################
# This script initializes and manages the Aether Docker stack.
#
# Usage:
#   ./infrastructure/docker/startup.sh [command] [options]
#
# Commands:
#   init       - Initialize Docker infrastructure (create data directories)
#   up         - Start Docker stack
#   down       - Stop Docker stack
#   logs       - View Docker logs (streaming)
#   health     - Check health of all services
#   pull-models - Pull AI models (requires running Ollama)
#   restart    - Restart Docker stack
#   reset      - Stop and remove all containers/volumes (WARNING: data loss)
#   build      - Build Docker images from Dockerfiles
#
# Examples:
#   ./infrastructure/docker/startup.sh init
#   ./infrastructure/docker/startup.sh up
#   ./infrastructure/docker/startup.sh down
#   ./infrastructure/docker/startup.sh logs
#   ./infrastructure/docker/startup.sh health
#
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.dev.yml"
COMPOSE_PROD_FILE="$SCRIPT_DIR/docker-compose.prod.yml"
DATA_DIR="$PROJECT_ROOT/data"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Initialization
# ============================================================================

init_infrastructure() {
  print_header "Initializing Docker Infrastructure"

  # Create data directories if they don't exist
  mkdir -p "$DATA_DIR/postgres"
  mkdir -p "$DATA_DIR/redis"
  mkdir -p "$DATA_DIR/ollama"

  print_success "Created data directories"
  print_info "Data directory: $DATA_DIR"

  # Set permissions
  chmod 755 "$DATA_DIR/postgres" "$DATA_DIR/redis" "$DATA_DIR/ollama"

  print_success "Infrastructure initialized"
}

# ============================================================================
# Docker Stack Management
# ============================================================================

docker_up() {
  print_header "Starting Docker Stack"

  cd "$PROJECT_ROOT"

  if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose not found. Please install Docker."
    exit 1
  fi

  # Check if containers are already running
  if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_warning "Some containers are already running"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  print_info "Starting services..."
  docker-compose -f "$COMPOSE_FILE" up -d

  print_success "Docker stack started"

  # Show status
  sleep 2
  docker-compose -f "$COMPOSE_FILE" ps
}

docker_down() {
  print_header "Stopping Docker Stack"

  cd "$PROJECT_ROOT"

  docker-compose -f "$COMPOSE_FILE" down

  print_success "Docker stack stopped"
}

docker_logs() {
  print_header "Docker Logs (Streaming)"
  print_info "Press Ctrl+C to exit"

  cd "$PROJECT_ROOT"
  docker-compose -f "$COMPOSE_FILE" logs -f
}

docker_build() {
  print_header "Building Docker Images"

  cd "$PROJECT_ROOT"

  print_info "Building API image..."
  docker build -f "$SCRIPT_DIR/Dockerfile.api" -t aether-api:latest .
  print_success "API image built"

  print_info "Building Web image..."
  docker build -f "$SCRIPT_DIR/Dockerfile.web" -t aether-web:latest .
  print_success "Web image built"

  print_info "Building Indexer image..."
  docker build -f "$SCRIPT_DIR/Dockerfile.indexer" -t aether-indexer:latest .
  print_success "Indexer image built"

  print_info "Building AI Service image..."
  docker build -f "$SCRIPT_DIR/Dockerfile.ai-service" -t aether-ai:latest .
  print_success "AI Service image built"

  print_success "All Docker images built successfully"
}

# ============================================================================
# Health Checks
# ============================================================================

check_health() {
  print_header "Checking Service Health"

  cd "$PROJECT_ROOT"

  # PostgreSQL
  print_info "Checking PostgreSQL..."
  if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U aether &> /dev/null; then
    print_success "PostgreSQL is healthy"
  else
    print_error "PostgreSQL is not responding"
  fi

  # Redis
  print_info "Checking Redis..."
  if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
    print_success "Redis is healthy"
  else
    print_error "Redis is not responding"
  fi

  # Ollama
  print_info "Checking Ollama..."
  if docker-compose -f "$COMPOSE_FILE" exec -T ollama curl -s http://localhost:11434/api/tags &> /dev/null; then
    print_success "Ollama is healthy"
  else
    print_warning "Ollama is not responding (this may be normal on first startup)"
  fi

  echo ""
  print_info "Service endpoints:"
  echo "  PostgreSQL: localhost:5432 (aether/aether123)"
  echo "  Redis: localhost:6379"
  echo "  Ollama: http://localhost:11434"
  echo ""
  print_info "Connection strings:"
  echo "  DATABASE_URL=postgresql://aether:aether123@localhost:5432/aether_dev"
  echo "  REDIS_URL=redis://localhost:6379"
  echo ""
}

# ============================================================================
# AI Model Management
# ============================================================================

pull_models() {
  print_header "Pulling AI Models"

  cd "$PROJECT_ROOT"

  print_info "Checking if Ollama is running..."
  if ! docker-compose -f "$COMPOSE_FILE" ps ollama | grep -q "Up"; then
    print_error "Ollama is not running. Start with: ./startup.sh up"
    exit 1
  fi

  # List of models to pull
  MODELS=("mistral" "neural-chat" "quantized-llama2")

  for model in "${MODELS[@]}"; do
    print_info "Pulling $model model..."
    if docker-compose -f "$COMPOSE_FILE" exec -T ollama ollama pull "$model"; then
      print_success "Downloaded $model"
    else
      print_warning "Failed to pull $model (may already exist)"
    fi
  done

  # List pulled models
  print_info "Available models:"
  docker-compose -f "$COMPOSE_FILE" exec -T ollama ollama list

  print_success "Model pull completed"
}

# ============================================================================
# Restart & Reset
# ============================================================================

docker_restart() {
  print_header "Restarting Docker Stack"

  docker_down
  sleep 2
  docker_up
  sleep 3
  check_health

  print_success "Docker stack restarted"
}

docker_reset() {
  print_header "RESETTING Docker Stack (WARNING: Data Loss)"
  print_error "This will delete all containers and volumes!"

  read -p "Type 'reset' to confirm: " confirmation
  if [[ "$confirmation" != "reset" ]]; then
    print_info "Reset cancelled"
    exit 0
  fi

  cd "$PROJECT_ROOT"

  print_info "Stopping containers..."
  docker-compose -f "$COMPOSE_FILE" down -v

  print_info "Removing data directories..."
  rm -rf "$DATA_DIR"

  print_success "Reset complete"
  print_warning "Run './startup.sh init && ./startup.sh up' to restart"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  if [[ $# -eq 0 ]]; then
    print_header "Aether Docker Startup Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  init         - Initialize Docker infrastructure"
    echo "  up           - Start Docker stack"
    echo "  down         - Stop Docker stack"
    echo "  logs         - View Docker logs"
    echo "  health       - Check health of all services"
    echo "  pull-models  - Pull AI models"
    echo "  restart      - Restart Docker stack"
    echo "  reset        - Reset all containers/volumes (DATA LOSS!)"
    echo "  build        - Build Docker images"
    echo ""
    echo "Examples:"
    echo "  $0 init"
    echo "  $0 up"
    echo "  $0 logs"
    exit 0
  fi

  case "$1" in
    init)
      init_infrastructure
      ;;
    up)
      docker_up
      sleep 2
      check_health
      ;;
    down)
      docker_down
      ;;
    logs)
      docker_logs
      ;;
    health)
      check_health
      ;;
    pull-models)
      pull_models
      ;;
    restart)
      docker_restart
      ;;
    reset)
      docker_reset
      ;;
    build)
      docker_build
      ;;
    *)
      print_error "Unknown command: $1"
      echo "Use '$0' to see available commands"
      exit 1
      ;;
  esac
}

main "$@"
