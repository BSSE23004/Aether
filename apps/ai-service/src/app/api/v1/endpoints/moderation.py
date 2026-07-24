"""
Moderation API Endpoints
Content moderation endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from app.schemas.moderation import (
    ModerationRequest,
    ModerationResponse,
    BatchModerationRequest,
    BatchModerationResponse
)
from app.services.moderation_service import ModerationService

router = APIRouter()


async def get_moderation_service(request: Request) -> ModerationService:
    """Dependency to get moderation service"""
    return ModerationService(
        ollama=request.app.state.ollama,
        cache=request.app.state.cache
    )


@router.post("/moderate", response_model=ModerationResponse)
async def moderate_text(
    request: ModerationRequest,
    moderation_service: ModerationService = Depends(get_moderation_service)
):
    """
    Moderate a single text

    - **text**: Text to moderate
    - **model**: Model to use (optional)
    - **categories**: Specific categories to check (optional)
    """
    try:
        return await moderation_service.moderate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchModerationResponse)
async def batch_moderate(
    request: BatchModerationRequest,
    moderation_service: ModerationService = Depends(get_moderation_service)
):
    """
    Moderate multiple texts

    - **texts**: List of texts to moderate
    - **model**: Model to use (optional)
    - **categories**: Specific categories to check (optional)
    """
    try:
        return await moderation_service.batch_moderate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))