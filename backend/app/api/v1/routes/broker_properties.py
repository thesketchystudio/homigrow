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

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireBroker
from app.db.session import get_db
from app.schemas.properties import (
    BrokerPropertyDetailRead,
    BrokerPropertyListItem,
    PropertyCreateRequest,
    PropertyMediaRead,
    PropertyRead,
    PropertyUpdateRequest,
)
from app.services import broker_property_service

router = APIRouter(prefix="/properties", tags=["properties", "broker"])


# Declared ahead of the writes below (and, at the include_router level,
# ahead of properties.router's GET /properties/{property_id}) so this
# literal path wins — see the comment in app/api/v1/router.py.
@router.get("/mine", response_model=list[BrokerPropertyListItem])
def list_my_properties(
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> list[BrokerPropertyListItem]:
    """Lists every property owned by the calling broker, across all statuses — backs the Dashboard's empty state."""
    return broker_property_service.list_my_properties(db, user)


# Nested under the literal "/mine" segment (never "/properties/{property_id}"
# directly), so it can't collide with properties.router's public,
# active-only GET /properties/{property_id} regardless of router
# registration order.
@router.get("/mine/{property_id}", response_model=BrokerPropertyDetailRead)
def get_my_property(
    property_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> BrokerPropertyDetailRead:
    """Returns one of the broker's own properties in full detail, any status — backs the Property Detail page."""
    return broker_property_service.get_property_detail(db, user, property_id)


@router.post("/{property_id}/close", response_model=PropertyRead)
def close_property(
    property_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Marks an active listing sold (sale) or rented (rent/PG) — the Property Detail page's "Mark as Sold" action."""
    property_ = broker_property_service.close_property(db, user, property_id)
    return PropertyRead.model_validate(property_)


@router.post("/{property_id}/reopen", response_model=PropertyRead)
def reopen_property(
    property_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Reopens a sold/rented listing back to active — undoes an accidental "Mark as Sold"/"Mark as Rented" click."""
    property_ = broker_property_service.reopen_property(db, user, property_id)
    return PropertyRead.model_validate(property_)


@router.post("", response_model=PropertyRead)
def create_property(
    data: PropertyCreateRequest,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Creates a new draft listing — the Post Property wizard's final submit action."""
    property_ = broker_property_service.create_property(db, user, data)
    return PropertyRead.model_validate(property_)


@router.patch("/{property_id}", response_model=PropertyRead)
def update_property(
    property_id: UUID,
    data: PropertyUpdateRequest,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Applies a partial edit to a broker-owned listing — the Edit Listing form's submit action."""
    property_ = broker_property_service.update_property(db, user, property_id, data)
    return PropertyRead.model_validate(property_)


@router.delete("/{property_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property_media(
    property_id: UUID,
    media_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> None:
    """Removes one photo/video from a listing's gallery; 403 if the property isn't owned by the caller."""
    broker_property_service.delete_media(db, user, property_id, media_id)


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


@router.post("/{property_id}/media/video", response_model=PropertyMediaRead)
def upload_property_video(
    property_id: UUID,
    user: RequireBroker,
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> PropertyMediaRead:
    """Uploads a property walkthrough or drone video; 403 if the property isn't owned by the caller."""
    media = broker_property_service.add_video(db, user, property_id, video.file.read(), video.content_type)
    return PropertyMediaRead.model_validate(media)


@router.post("/{property_id}/jv-agreement", response_model=PropertyRead)
def upload_jv_agreement(
    property_id: UUID,
    user: RequireBroker,
    document: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Uploads the JV agreement document; 422 if the property isn't flagged as a JV property."""
    property_ = broker_property_service.upload_jv_agreement(db, user, property_id, document.file.read(), document.content_type)
    return PropertyRead.model_validate(property_)


@router.post("/{property_id}/submit", response_model=PropertyRead)
def submit_property(
    property_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Moves a draft listing to pending (broker moderation queue)."""
    property_ = broker_property_service.submit_property(db, user, property_id)
    return PropertyRead.model_validate(property_)
