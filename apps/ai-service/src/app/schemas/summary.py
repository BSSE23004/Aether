"""
Schemas for Summary API
Request and response models for text summarization
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class SummaryRequest(BaseModel):
    """Request model for text summarization"""

    text: str = Field(..., description="Text to summarize", min_length=1)
    model: Optional[str] = Field(None, description="Model to use for summarization")
    max_length: Optional[int] = Field(None, description="Maximum length of summary")
    temperature: Optional[float] = Field(None, description="Temperature for generation")
    system_prompt: Optional[str] = Field(
        None,
        description="System prompt for the model"
    )


class SummaryResponse(BaseModel):
    """Response model for text summarization"""

    summary: str = Field(..., description="Generated summary")
    model: str = Field(..., description="Model used for summarization")
    original_length: int = Field(..., description="Length of original text")
    summary_length: int = Field(..., description="Length of summary")
    compression_ratio: float = Field(..., description="Compression ratio")
    cached: bool = Field(False, description="Whether result was cached")


class BatchSummaryRequest(BaseModel):
    """Request model for batch summarization"""

    texts: List[str] = Field(..., description="List of texts to summarize")
    model: Optional[str] = Field(None, description="Model to use for summarization")
    max_length: Optional[int] = Field(None, description="Maximum length of summary")
    temperature: Optional[float] = Field(None, description="Temperature for generation")


class BatchSummaryResponse(BaseModel):
    """Response model for batch summarization"""

    summaries: List[SummaryResponse] = Field(..., description="List of summaries")
    total_texts: int = Field(..., description="Total number of texts processed")
    cached_count: int = Field(0, description="Number of cached results")