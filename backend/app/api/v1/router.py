"""
app/api/v1/router.py

Aggregates every v1 resource router under a single /api/v1 prefix, so
main.py mounts one router instead of importing each route module.
"""

from fastapi import APIRouter

from app.api.v1.routes import auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
