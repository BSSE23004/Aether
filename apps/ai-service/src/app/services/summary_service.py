"""
Summary Service - Text summarization
Handles text summarization using Ollama models
"""

import logging
from typing import List, Optional
from fastapi import Request

from app.services.ollama_service import OllamaService
from app.services.cache_service import CacheService
from app.schemas.summary import SummaryRequest, SummaryResponse, BatchSummaryRequest, BatchSummaryResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class SummaryService:
    """Service for text summarization"""

    def __init__(self, ollama: OllamaService, cache: CacheService):
        self.ollama = ollama
        self.cache = cache

    async def summarize(self, request: SummaryRequest) -> SummaryResponse:
        """Generate summary for a single text"""

        # Check cache first
        cached_summary = await self.cache.get_summary(
            request.text,
            request.model or settings.SUMMARY_MODEL
        )
        if cached_summary:
            logger.info("Returning cached summary")
            return SummaryResponse(
                summary=cached_summary,
                model=request.model or settings.SUMMARY_MODEL,
                original_length=len(request.text),
                summary_length=len(cached_summary),
                compression_ratio=len(cached_summary) / len(request.text),
                cached=True
            )

        # Generate summary
        system_prompt = request.system_prompt or (
            "You are a helpful assistant that summarizes text concisely and accurately. "
            "Provide a clear, well-structured summary that captures the main points."
        )

        try:
            response = await self.ollama.generate(
                prompt=f"Summarize the following text:\n\n{request.text}",
                model=request.model or settings.SUMMARY_MODEL,
                system=system_prompt,
                temperature=request.temperature or settings.SUMMARY_TEMPERATURE,
                max_tokens=request.max_length or settings.SUMMARY_MAX_TOKENS
            )

            summary = response.get('response', '').strip()

            # Cache the result
            await self.cache.set_summary(
                request.text,
                request.model or settings.SUMMARY_MODEL,
                summary
            )

            return SummaryResponse(
                summary=summary,
                model=request.model or settings.SUMMARY_MODEL,
                original_length=len(request.text),
                summary_length=len(summary),
                compression_ratio=len(summary) / len(request.text),
                cached=False
            )

        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            raise

    async def batch_summarize(self, request: BatchSummaryRequest) -> BatchSummaryResponse:
        """Generate summaries for multiple texts"""

        summaries = []
        cached_count = 0

        for text in request.texts:
            summary_request = SummaryRequest(
                text=text,
                model=request.model,
                max_length=request.max_length,
                temperature=request.temperature
            )

            try:
                summary = await self.summarize(summary_request)
                summaries.append(summary)
                if summary.cached:
                    cached_count += 1
            except Exception as e:
                logger.error(f"Failed to summarize text: {e}")
                # Add a fallback summary
                summaries.append(SummaryResponse(
                    summary="[Error generating summary]",
                    model=request.model or settings.SUMMARY_MODEL,
                    original_length=len(text),
                    summary_length=0,
                    compression_ratio=0,
                    cached=False
                ))

        return BatchSummaryResponse(
            summaries=summaries,
            total_texts=len(request.texts),
            cached_count=cached_count
        )

    async def summarize_conversation(
        self,
        messages: List[dict],
        model: Optional[str] = None
    ) -> str:
        """Summarize a conversation"""

        # Format conversation as text
        conversation_text = "\n".join([
            f"{msg.get('role', 'user')}: {msg.get('content', '')}"
            for msg in messages
        ])

        system_prompt = (
            "You are a helpful assistant that summarizes conversations. "
            "Provide a concise summary of the conversation, highlighting key points, "
            "decisions made, and action items."
        )

        try:
            response = await self.ollama.generate(
                prompt=f"Summarize the following conversation:\n\n{conversation_text}",
                model=model or settings.SUMMARY_MODEL,
                system=system_prompt,
                temperature=settings.SUMMARY_TEMPERATURE,
                max_tokens=settings.SUMMARY_MAX_TOKENS
            )

            return response.get('response', '').strip()

        except Exception as e:
            logger.error(f"Failed to summarize conversation: {e}")
            raise