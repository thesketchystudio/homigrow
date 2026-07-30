"""
app/api/v1/routes/properties.py

Public property-listing endpoints (05_API_Design.md §properties). No auth
required — these serve the public Property Details and Listings screens.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import ListingType, PropertyType
from app.schemas.properties import PropertyListResponse, PropertyRead
from app.services import property_service
from app.services.property_service import SortOption

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=PropertyListResponse)
def list_properties(
    db: Session = Depends(get_db),
    city: str | None = None,
    listing_type: ListingType | None = None,
    property_type: list[PropertyType] = Query(default=[]),
    price_min: float | None = Query(default=None, ge=0),
    price_max: float | None = Query(default=None, ge=0),
    bhk_min: int | None = Query(default=None, ge=1),
    amenities: list[str] = Query(default=[]),
    sort: SortOption = "newest",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> PropertyListResponse:
    """The search/listings grid endpoint. Filters are typed query params (05_API_Design.md §properties); unknown `sort` values 422 automatically via the Literal type."""
    items, total = property_service.list_properties(
        db,
        city=city,
        listing_type=listing_type,
        property_type=property_type or None,
        price_min=price_min,
        price_max=price_max,
        bhk_min=bhk_min,
        amenities=amenities or None,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return PropertyListResponse(items=items, page=page, page_size=page_size, total=total)


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(property_id: UUID, db: Session = Depends(get_db)) -> PropertyRead:
    """Returns an active property's full detail; 404 if missing or not active."""
    property_ = property_service.get_property_detail(db, property_id)
    return PropertyRead.model_validate(property_)
