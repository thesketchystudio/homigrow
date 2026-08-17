"""
app/api/v1/routes/broker_properties.py

Broker-authenticated property-listing writes for the Post Property
wizard. Kept separate from routes/properties.py, which is explicitly
documented "No auth required" for its entire module — mixing
RequireBroker-gated writes into it would contradict that. Shares the
same "/properties" URL prefix; FastAPI allows multiple routers to
register under one prefix.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireBroker
from app.db.session import get_db
from app.schemas.properties import PropertyCreateRequest, PropertyMediaRead, PropertyRead
from app.services import broker_property_service

router = APIRouter(prefix="/properties", tags=["properties", "broker"])


@router.post("", response_model=PropertyRead)
def create_property(
    data: PropertyCreateRequest,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Creates a new draft listing — the Post Property wizard's final submit action."""
    property_ = broker_property_service.create_property(db, user, data)
    return PropertyRead.model_validate(property_)


@router.post("/{property_id}/media", response_model=list[PropertyMediaRead])
def upload_property_media(
    property_id: UUID,
    user: RequireBroker,
    images: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
) -> list[PropertyMediaRead]:
    """Uploads one or more listing photos; 403 if the property isn't owned by the caller."""
    uploads = [(image.file.read(), image.content_type) for image in images]
    media = broker_property_service.add_media(db, user, property_id, uploads)
    return [PropertyMediaRead.model_validate(item) for item in media]


@router.post("/{property_id}/submit", response_model=PropertyRead)
def submit_property(
    property_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Moves a draft listing to pending (broker moderation queue)."""
    property_ = broker_property_service.submit_property(db, user, property_id)
    return PropertyRead.model_validate(property_)
