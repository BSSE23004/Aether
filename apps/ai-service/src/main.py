"""
Aether AI Service - FastAPI Application
Main entry point for the AI service with Ollama integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting Aether AI Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Ollama URL: {settings.OLLAMA_URL}")
    logger.info(f"Redis URL: {settings.REDIS_URL}")

    # Initialize services
    from app.services.ollama_service import OllamaService
    from app.services.cache_service import CacheService

    app.state.ollama = OllamaService(settings.OLLAMA_URL)
    app.state.cache = CacheService(settings.REDIS_URL)

    # Test Ollama connection
    try:
        await app.state.ollama.health_check()
        logger.info("Ollama connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Ollama: {e}")

    yield

    # Shutdown
    logger.info("Shutting down Aether AI Service...")


# Create FastAPI app
app = FastAPI(
    title="Aether AI Service",
    description="AI-powered features for Aether platform using Ollama",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "aether-ai-service",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Aether AI Service",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=settings.ENVIRONMENT == "development"
    )