"""
app/api/v1/routes/saved_properties.py

Client watchlist endpoints (05_API_Design.md §saved-properties). Every
route depends on CurrentUser and acts on the caller's own saved list —
there is no admin/broker access to another user's watchlist.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.deps import CurrentUser
from app.db.session import get_db
from app.schemas.saved_properties import SavedPropertyListResponse
from app.services import saved_property_service

router = APIRouter(prefix="/saved-properties", tags=["saved-properties"])


@router.get("", response_model=SavedPropertyListResponse)
def list_saved_properties(
    user: CurrentUser,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> SavedPropertyListResponse:
    """Lists the caller's saved properties, newest-saved first."""
    items, total = saved_property_service.list_saved_properties(db, user.id, page=page, page_size=page_size)
    return SavedPropertyListResponse(items=items, page=page, page_size=page_size, total=total)


@router.put("/{property_id}", status_code=204)
def save_property(property_id: UUID, user: CurrentUser, db: Session = Depends(get_db)) -> None:
    """Idempotent save; 404 if the property doesn't exist."""
    saved_property_service.save_property(db, user.id, property_id)


@router.delete("/{property_id}", status_code=204)
def unsave_property(property_id: UUID, user: CurrentUser, db: Session = Depends(get_db)) -> None:
    """Idempotent unsave; no error if it wasn't saved."""
    saved_property_service.unsave_property(db, user.id, property_id)
