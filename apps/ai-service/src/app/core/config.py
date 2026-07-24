"""
Configuration settings for Aether AI Service
Environment-based configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "Aether AI Service"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    VERSION: str = "1.0.0"

    # API Configuration
    API_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Ollama Configuration
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_TIMEOUT: int = 120  # seconds
    OLLAMA_MAX_RETRIES: int = 3
    OLLAMA_DEFAULT_MODEL: str = "llama2"

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    REDIS_MAX_CONNECTIONS: int = 10

    # PostgreSQL Configuration
    DATABASE_URL: str = "postgresql://aether:aether@localhost:5432/aether"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # AI Model Configuration
    SUMMARY_MODEL: str = "llama2"
    SUMMARY_MAX_TOKENS: int = 500
    SUMMARY_TEMPERATURE: float = 0.7

    SEMANTIC_SEARCH_MODEL: str = "nomic-embed-text"
    SEMANTIC_SEARCH_DIMENSIONS: int = 768
    SEMANTIC_SEARCH_TOP_K: int = 5

    MODERATION_MODEL: str = "llama2"
    MODERATION_THRESHOLD: float = 0.5
    MODERATION_CATEGORIES: List[str] = [
        "hate_speech",
        "harassment",
        "explicit_content",
        "violence",
        "self_harm"
    ]

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    LOG_FILE: Optional[str] = None

    # Monitoring
    METRICS_ENABLED: bool = True
    METRICS_PORT: int = 9090

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get settings instance"""
    return settings