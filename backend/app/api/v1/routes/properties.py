"""
app/api/v1/routes/properties.py

Public property-listing endpoints (05_API_Design.md §properties). No auth
required — these serve the public Property Details screen.
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.properties import PropertyRead
from app.services import property_service

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(property_id: UUID, db: Session = Depends(get_db)) -> PropertyRead:
    """Returns an active property's full detail; 404 if missing or not active."""
    property_ = property_service.get_property_detail(db, property_id)
    return PropertyRead.model_validate(property_)
