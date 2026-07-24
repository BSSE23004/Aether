"""
Schemas for Moderation API
Request and response models for content moderation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ModerationRequest(BaseModel):
    """Request model for content moderation"""

    text: str = Field(..., description="Text to moderate", min_length=1)
    model: Optional[str] = Field(None, description="Model to use for moderation")
    categories: Optional[List[str]] = Field(
        None,
        description="Specific categories to check (default: all)"
    )


class ModerationCategory(BaseModel):
    """Single moderation category result"""

    category: str = Field(..., description="Category name")
    score: float = Field(..., description="Moderation score (0-1)")
    flagged: bool = Field(..., description="Whether content was flagged")


class ModerationResponse(BaseModel):
    """Response model for content moderation"""

    flagged: bool = Field(..., description="Whether content was flagged overall")
    categories: List[ModerationCategory] = Field(..., description="Category-wise results")
    model: str = Field(..., description="Model used for moderation")
    cached: bool = Field(False, description="Whether result was cached")


class BatchModerationRequest(BaseModel):
    """Request model for batch moderation"""

    texts: List[str] = Field(..., description="List of texts to moderate")
    model: Optional[str] = Field(None, description="Model to use for moderation")
    categories: Optional[List[str]] = Field(
        None,
        description="Specific categories to check (default: all)"
    )


class BatchModerationResponse(BaseModel):
    """Response model for batch moderation"""

    results: List[ModerationResponse] = Field(..., description="List of moderation results")
    total_texts: int = Field(..., description="Total number of texts processed")
    flagged_count: int = Field(0, description="Number of flagged texts")
    cached_count: int = Field(0, description="Number of cached results")