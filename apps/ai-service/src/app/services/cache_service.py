"""
Cache Service - Redis integration
Handles caching for AI responses and embeddings
"""

import json
import logging
from typing import Optional, Any, List
import aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for Redis caching operations"""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.ttl = settings.REDIS_CACHE_TTL
        self.max_connections = settings.REDIS_MAX_CONNECTIONS
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        """Establish Redis connection"""
        try:
            self.client = await aioredis.from_url(
                self.redis_url,
                max_connections=self.max_connections,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if not self.client:
                await self.connect()

            value = await self.client.get(key)
            if value:
                # Try to parse as JSON
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Failed to get from cache: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache"""
        try:
            if not self.client:
                await self.connect()

            if isinstance(value, (dict, list)):
                value = json.dumps(value)

            ttl = ttl or self.ttl
            await self.client.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.error(f"Failed to set in cache: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if not self.client:
                await self.connect()

            await self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Failed to delete from cache: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if not self.client:
                await self.connect()

            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Failed to check cache existence: {e}")
            return False

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """Get cached embedding for text"""
        cache_key = f"embedding:{hash(text)}"
        return await self.get(cache_key)

    async def set_embedding(self, text: str, embedding: List[float], ttl: int = None) -> bool:
        """Cache embedding for text"""
        cache_key = f"embedding:{hash(text)}"
        return await self.set(cache_key, embedding, ttl)

    async def get_summary(self, text: str, model: str) -> Optional[str]:
        """Get cached summary for text"""
        cache_key = f"summary:{model}:{hash(text)}"
        return await self.get(cache_key)

    async def set_summary(self, text: str, model: str, summary: str, ttl: int = None) -> bool:
        """Cache summary for text"""
        cache_key = f"summary:{model}:{hash(text)}"
        return await self.set(cache_key, summary, ttl)

    async def get_moderation(self, text: str) -> Optional[Dict[str, Any]]:
        """Get cached moderation result for text"""
        cache_key = f"moderation:{hash(text)}"
        return await self.get(cache_key)

    async def set_moderation(self, text: str, result: Dict[str, Any], ttl: int = None) -> bool:
        """Cache moderation result for text"""
        cache_key = f"moderation:{hash(text)}"
        return await self.set(cache_key, result, ttl)

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            if not self.client:
                await self.connect()

            keys = []
            async for key in self.client.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                await self.client.delete(*keys)
                logger.info(f"Cleared {len(keys)} keys matching pattern: {pattern}")
                return len(keys)
            return 0
        except Exception as e:
            logger.error(f"Failed to clear pattern: {e}")
            return 0

    async def health_check(self) -> bool:
        """Check Redis health"""
        try:
            if not self.client:
                await self.connect()

            await self.client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False