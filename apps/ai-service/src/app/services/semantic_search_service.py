"""
Semantic Search Service - Text similarity and search
Handles semantic search using embeddings
"""

import logging
from typing import List, Optional
import math

from app.services.ollama_service import OllamaService
from app.services.cache_service import CacheService
from app.schemas.semantic_search import (
    EmbeddingRequest,
    EmbeddingResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    SearchResult,
    SimilarityRequest,
    SimilarityResponse
)
from app.core.config import settings

logger = logging.getLogger(__name__)


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)


class SemanticSearchService:
    """Service for semantic search and similarity"""

    def __init__(self, ollama: OllamaService, cache: CacheService):
        self.ollama = ollama
        self.cache = cache

    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding for text"""

        # Check cache first
        cached_embedding = await self.cache.get_embedding(request.text)
        if cached_embedding:
            logger.info("Returning cached embedding")
            return EmbeddingResponse(
                embedding=cached_embedding,
                model=request.model or settings.SEMANTIC_SEARCH_MODEL,
                dimensions=len(cached_embedding),
                cached=True
            )

        # Generate embedding
        try:
            embedding = await self.ollama.embed(
                text=request.text,
                model=request.model or settings.SEMANTIC_SEARCH_MODEL
            )

            # Cache the result
            await self.cache.set_embedding(request.text, embedding)

            return EmbeddingResponse(
                embedding=embedding,
                model=request.model or settings.SEMANTIC_SEARCH_MODEL,
                dimensions=len(embedding),
                cached=False
            )

        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    async def semantic_search(self, request: SemanticSearchRequest) -> SemanticSearchResponse:
        """Perform semantic search on documents"""

        model = request.model or settings.SEMANTIC_SEARCH_MODEL
        top_k = request.top_k or settings.SEMANTIC_SEARCH_TOP_K

        try:
            # Generate embedding for query
            query_embedding = await self.ollama.embed(
                text=request.query,
                model=model
            )

            # Generate embeddings for all documents
            document_embeddings = []
            for doc in request.documents:
                # Check cache
                cached = await self.cache.get_embedding(doc)
                if cached:
                    document_embeddings.append(cached)
                else:
                    embedding = await self.ollama.embed(text=doc, model=model)
                    await self.cache.set_embedding(doc, embedding)
                    document_embeddings.append(embedding)

            # Calculate similarities
            similarities = [
                cosine_similarity(query_embedding, doc_embedding)
                for doc_embedding in document_embeddings
            ]

            # Get top-k results
            indexed_similarities = list(enumerate(similarities))
            indexed_similarities.sort(key=lambda x: x[1], reverse=True)
            top_k_indices = indexed_similarities[:top_k]

            results = [
                SearchResult(
                    document=request.documents[i],
                    score=score,
                    index=i
                )
                for i, score in top_k_indices
            ]

            return SemanticSearchResponse(
                results=results,
                query=request.query,
                model=model,
                total_documents=len(request.documents)
            )

        except Exception as e:
            logger.error(f"Failed to perform semantic search: {e}")
            raise

    async def calculate_similarity(self, request: SimilarityRequest) -> SimilarityResponse:
        """Calculate similarity between two texts"""

        model = request.model or settings.SEMANTIC_SEARCH_MODEL

        # Check cache for similarity result
        cache_key = f"similarity:{hash(request.text1)}:{hash(request.text2)}"
        cached_similarity = await self.cache.get(cache_key)
        if cached_similarity:
            logger.info("Returning cached similarity")
            return SimilarityResponse(
                similarity=cached_similarity,
                model=model,
                cached=True
            )

        try:
            # Generate embeddings
            embedding1 = await self.ollama.embed(text=request.text1, model=model)
            embedding2 = await self.ollama.embed(text=request.text2, model=model)

            # Cache embeddings
            await self.cache.set_embedding(request.text1, embedding1)
            await self.cache.set_embedding(request.text2, embedding2)

            # Calculate cosine similarity
            similarity = cosine_similarity(embedding1, embedding2)

            # Cache result
            await self.cache.set(cache_key, float(similarity))

            return SimilarityResponse(
                similarity=float(similarity),
                model=model,
                cached=False
            )

        except Exception as e:
            logger.error(f"Failed to calculate similarity: {e}")
            raise

    async def find_similar_documents(
        self,
        query: str,
        documents: List[str],
        threshold: float = 0.5,
        model: Optional[str] = None
    ) -> List[SearchResult]:
        """Find documents similar to query above threshold"""

        search_request = SemanticSearchRequest(
            query=query,
            documents=documents,
            model=model,
            top_k=len(documents)
        )

        response = await self.semantic_search(search_request)

        # Filter by threshold
        filtered_results = [
            result for result in response.results
            if result.score >= threshold
        ]

        return filtered_results