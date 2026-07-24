"""
Ollama Service - AI model integration
Handles communication with Ollama for local LLM inference
"""

import httpx
import logging
from typing import Dict, List, Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with Ollama API"""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.timeout = settings.OLLAMA_TIMEOUT
        self.max_retries = settings.OLLAMA_MAX_RETRIES
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def health_check(self) -> bool:
        """Check if Ollama service is healthy"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            logger.info("Ollama health check passed")
            return True
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False

    async def list_models(self) -> List[str]:
        """List available models"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            logger.info(f"Available models: {models}")
            return models
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            raise

    async def generate(
        self,
        prompt: str,
        model: str = None,
        system: str = None,
        temperature: float = None,
        max_tokens: int = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Generate text using Ollama"""
        model = model or settings.OLLAMA_DEFAULT_MODEL
        temperature = temperature or settings.SUMMARY_TEMPERATURE
        max_tokens = max_tokens or settings.SUMMARY_MAX_TOKENS

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        if system:
            payload["system"] = system

        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Generated response using model {model}")
            return result
        except Exception as e:
            logger.error(f"Failed to generate text: {e}")
            raise

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = None,
        max_tokens: int = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Chat completion using Ollama"""
        model = model or settings.OLLAMA_DEFAULT_MODEL
        temperature = temperature or settings.SUMMARY_TEMPERATURE
        max_tokens = max_tokens or settings.SUMMARY_MAX_TOKENS

        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Chat completion using model {model}")
            return result
        except Exception as e:
            logger.error(f"Failed to complete chat: {e}")
            raise

    async def embed(
        self,
        text: str,
        model: str = None
    ) -> List[float]:
        """Generate embeddings for text"""
        model = model or settings.SEMANTIC_SEARCH_MODEL

        payload = {
            "model": model,
            "prompt": text
        }

        try:
            response = await self.client.post(
                f"{self.base_url}/api/embed",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            embedding = result.get('embedding', [])
            logger.info(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    async def pull_model(self, model: str) -> bool:
        """Pull a model from Ollama registry"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/pull",
                json={"name": model}
            )
            response.raise_for_status()
            logger.info(f"Successfully pulled model: {model}")
            return True
        except Exception as e:
            logger.error(f"Failed to pull model {model}: {e}")
            return False

    async def delete_model(self, model: str) -> bool:
        """Delete a model from Ollama"""
        try:
            response = await self.client.delete(
                f"{self.base_url}/api/delete",
                json={"name": model}
            )
            response.raise_for_status()
            logger.info(f"Successfully deleted model: {model}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete model {model}: {e}")
            return False

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
        logger.info("Ollama service client closed")