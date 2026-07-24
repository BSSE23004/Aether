"""
Schemas for Semantic Search API
Request and response models for semantic search functionality
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class EmbeddingRequest(BaseModel):
    """Request model for generating embeddings"""

    text: str = Field(..., description="Text to generate embedding for", min_length=1)
    model: Optional[str] = Field(None, description="Model to use for embedding")


class EmbeddingResponse(BaseModel):
    """Response model for embeddings"""

    embedding: List[float] = Field(..., description="Generated embedding vector")
    model: str = Field(..., description="Model used for embedding")
    dimensions: int = Field(..., description="Dimensions of embedding")
    cached: bool = Field(False, description="Whether result was cached")


class SemanticSearchRequest(BaseModel):
    """Request model for semantic search"""

    query: str = Field(..., description="Search query", min_length=1)
    documents: List[str] = Field(..., description="List of documents to search")
    model: Optional[str] = Field(None, description="Model to use for embeddings")
    top_k: Optional[int] = Field(None, description="Number of results to return")


class SearchResult(BaseModel):
    """Single search result"""

    document: str = Field(..., description="Document text")
    score: float = Field(..., description="Similarity score")
    index: int = Field(..., description="Index in original documents list")


class SemanticSearchResponse(BaseModel):
    """Response model for semantic search"""

    results: List[SearchResult] = Field(..., description="Search results")
    query: str = Field(..., description="Original query")
    model: str = Field(..., description="Model used for embeddings")
    total_documents: int = Field(..., description="Total documents searched")


class SimilarityRequest(BaseModel):
    """Request model for calculating similarity between texts"""

    text1: str = Field(..., description="First text", min_length=1)
    text2: str = Field(..., description="Second text", min_length=1)
    model: Optional[str] = Field(None, description="Model to use for embeddings")


class SimilarityResponse(BaseModel):
    """Response model for similarity calculation"""

    similarity: float = Field(..., description="Similarity score (0-1)")
    model: str = Field(..., description="Model used for embeddings")
    cached: bool = Field(False, description="Whether result was cached")