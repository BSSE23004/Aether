"""
API Router - Main API v1 router
Aggregates all API endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import summary, semantic_search, moderation

api_router = APIRouter()

# Include routers
api_router.include_router(summary.router, prefix="/summary", tags=["summary"])
api_router.include_router(semantic_search.router, prefix="/semantic-search", tags=["semantic-search"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])