"""
Summary API Endpoints
Text summarization endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from app.schemas.summary import (
    SummaryRequest,
    SummaryResponse,
    BatchSummaryRequest,
    BatchSummaryResponse
)
from app.services.summary_service import SummaryService

router = APIRouter()


async def get_summary_service(request: Request) -> SummaryService:
    """Dependency to get summary service"""
    return SummaryService(
        ollama=request.app.state.ollama,
        cache=request.app.state.cache
    )


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_text(
    request: SummaryRequest,
    summary_service: SummaryService = Depends(get_summary_service)
):
    """
    Summarize a single text

    - **text**: Text to summarize
    - **model**: Model to use (optional)
    - **max_length**: Maximum length of summary (optional)
    - **temperature**: Temperature for generation (optional)
    """
    try:
        return await summary_service.summarize(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchSummaryResponse)
async def batch_summarize(
    request: BatchSummaryRequest,
    summary_service: SummaryService = Depends(get_summary_service)
):
    """
    Summarize multiple texts

    - **texts**: List of texts to summarize
    - **model**: Model to use (optional)
    - **max_length**: Maximum length of summary (optional)
    - **temperature**: Temperature for generation (optional)
    """
    try:
        return await summary_service.batch_summarize(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversation")
async def summarize_conversation(
    messages: list,
    model: Optional[str] = None,
    summary_service: SummaryService = Depends(get_summary_service)
):
    """
    Summarize a conversation

    - **messages**: List of message objects with 'role' and 'content'
    - **model**: Model to use (optional)
    """
    try:
        summary = await summary_service.summarize_conversation(messages, model)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))