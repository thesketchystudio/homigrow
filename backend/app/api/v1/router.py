"""
app/api/v1/router.py

Aggregates every v1 resource router under a single /api/v1 prefix, so
main.py mounts one router instead of importing each route module.
"""

from fastapi import APIRouter

from app.api.v1.routes import auth, broker_properties, brokers, properties, saved_properties, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(brokers.router)
# broker_properties (which declares the literal GET /properties/mine)
# must be registered before properties (whose GET /properties/{property_id}
# would otherwise swallow it first — same reasoning that keeps
# /properties/compare and /properties/neighborhoods declared ahead of
# /properties/{property_id} within properties.py itself).
api_router.include_router(broker_properties.router)
api_router.include_router(properties.router)
api_router.include_router(saved_properties.router)
