"""
Moderation Service - Content moderation
Handles content moderation using AI models
"""

import logging
from typing import List, Optional
import json

from app.services.ollama_service import OllamaService
from app.services.cache_service import CacheService
from app.schemas.moderation import (
    ModerationRequest,
    ModerationResponse,
    ModerationCategory,
    BatchModerationRequest,
    BatchModerationResponse
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class ModerationService:
    """Service for content moderation"""

    def __init__(self, ollama: OllamaService, cache: CacheService):
        self.ollama = ollama
        self.cache = cache
        self.categories = settings.MODERATION_CATEGORIES
        self.threshold = settings.MODERATION_THRESHOLD

    async def moderate(self, request: ModerationRequest) -> ModerationResponse:
        """Moderate a single text"""

        # Check cache first
        cached_result = await self.cache.get_moderation(request.text)
        if cached_result:
            logger.info("Returning cached moderation result")
            return ModerationResponse(
                flagged=cached_result['flagged'],
                categories=[
                    ModerationCategory(**cat)
                    for cat in cached_result['categories']
                ],
                model=request.model or settings.MODERATION_MODEL,
                cached=True
            )

        # Determine categories to check
        categories = request.categories or self.categories

        # Generate moderation prompt
        prompt = self._build_moderation_prompt(request.text, categories)

        try:
            response = await self.ollama.generate(
                prompt=prompt,
                model=request.model or settings.MODERATION_MODEL,
                system="You are a content moderation assistant. Analyze text for inappropriate content.",
                temperature=0.3,  # Lower temperature for more consistent results
                max_tokens=500
            )

            # Parse response
            moderation_result = self._parse_moderation_response(
                response.get('response', ''),
                categories
            )

            # Determine if flagged
            flagged = any(
                cat.score >= self.threshold
                for cat in moderation_result
            )

            result = ModerationResponse(
                flagged=flagged,
                categories=moderation_result,
                model=request.model or settings.MODERATION_MODEL,
                cached=False
            )

            # Cache the result
            await self.cache.set_moderation(
                request.text,
                {
                    'flagged': result.flagged,
                    'categories': [cat.dict() for cat in result.categories]
                }
            )

            return result

        except Exception as e:
            logger.error(f"Failed to moderate text: {e}")
            raise

    async def batch_moderate(self, request: BatchModerationRequest) -> BatchModerationResponse:
        """Moderate multiple texts"""

        results = []
        flagged_count = 0
        cached_count = 0

        for text in request.texts:
            moderation_request = ModerationRequest(
                text=text,
                model=request.model,
                categories=request.categories
            )

            try:
                result = await self.moderate(moderation_request)
                results.append(result)
                if result.flagged:
                    flagged_count += 1
                if result.cached:
                    cached_count += 1
            except Exception as e:
                logger.error(f"Failed to moderate text: {e}")
                # Add a fallback result
                results.append(ModerationResponse(
                    flagged=False,
                    categories=[
                        ModerationCategory(
                            category=cat,
                            score=0.0,
                            flagged=False
                        )
                        for cat in (request.categories or self.categories)
                    ],
                    model=request.model or settings.MODERATION_MODEL,
                    cached=False
                ))

        return BatchModerationResponse(
            results=results,
            total_texts=len(request.texts),
            flagged_count=flagged_count,
            cached_count=cached_count
        )

    def _build_moderation_prompt(self, text: str, categories: List[str]) -> str:
        """Build moderation prompt for AI model"""

        categories_str = ", ".join(categories)

        prompt = f"""Analyze the following text for content moderation. Check for these categories: {categories_str}.

For each category, provide a score from 0.0 to 1.0, where:
- 0.0 = No content of this type
- 0.5 = Some content of this type
- 1.0 = Strong content of this type

Text to analyze:
{text}

Respond in JSON format with this structure:
{{
  "categories": {{
    "category_name": {{"score": 0.0, "flagged": false}},
    ...
  }}
}}"""

        return prompt

    def _parse_moderation_response(
        self,
        response: str,
        categories: List[str]
    ) -> List[ModerationCategory]:
        """Parse moderation response from AI model"""

        try:
            # Try to extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                data = json.loads(json_str)

                moderation_categories = []
                for category in categories:
                    cat_data = data.get('categories', {}).get(category, {})
                    score = cat_data.get('score', 0.0)
                    flagged = cat_data.get('flagged', score >= self.threshold)

                    moderation_categories.append(
                        ModerationCategory(
                            category=category,
                            score=score,
                            flagged=flagged
                        )
                    )

                return moderation_categories

        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse moderation response: {e}")

        # Fallback: return zero scores for all categories
        return [
            ModerationCategory(
                category=category,
                score=0.0,
                flagged=False
            )
            for category in categories
        ]