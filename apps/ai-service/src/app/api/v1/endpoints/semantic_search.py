"""
Semantic Search API Endpoints
Semantic search and similarity endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional, List

from app.schemas.semantic_search import (
    EmbeddingRequest,
    EmbeddingResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    SimilarityRequest,
    SimilarityResponse
)
from app.services.semantic_search_service import SemanticSearchService

router = APIRouter()


async def get_semantic_search_service(request: Request) -> SemanticSearchService:
    """Dependency to get semantic search service"""
    return SemanticSearchService(
        ollama=request.app.state.ollama,
        cache=request.app.state.cache
    )


@router.post("/embed", response_model=EmbeddingResponse)
async def generate_embedding(
    request: EmbeddingRequest,
    semantic_service: SemanticSearchService = Depends(get_semantic_search_service)
):
    """
    Generate embedding for text

    - **text**: Text to generate embedding for
    - **model**: Model to use (optional)
    """
    try:
        return await semantic_service.generate_embedding(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SemanticSearchResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    semantic_service: SemanticSearchService = Depends(get_semantic_search_service)
):
    """
    Perform semantic search on documents

    - **query**: Search query
    - **documents**: List of documents to search
    - **model**: Model to use (optional)
    - **top_k**: Number of results to return (optional)
    """
    try:
        return await semantic_service.semantic_search(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similarity", response_model=SimilarityResponse)
async def calculate_similarity(
    request: SimilarityRequest,
    semantic_service: SemanticSearchService = Depends(get_semantic_search_service)
):
    """
    Calculate similarity between two texts

    - **text1**: First text
    - **text2**: Second text
    - **model**: Model to use (optional)
    """
    try:
        return await semantic_service.calculate_similarity(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar-documents")
async def find_similar_documents(
    query: str,
    documents: List[str],
    threshold: float = 0.5,
    model: Optional[str] = None,
    semantic_service: SemanticSearchService = Depends(get_semantic_search_service)
):
    """
    Find documents similar to query above threshold

    - **query**: Search query
    - **documents**: List of documents to search
    - **threshold**: Similarity threshold (default: 0.5)
    - **model**: Model to use (optional)
    """
    try:
        results = await semantic_service.find_similar_documents(
            query=query,
            documents=documents,
            threshold=threshold,
            model=model
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))