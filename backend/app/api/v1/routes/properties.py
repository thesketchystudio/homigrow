"""
app/api/v1/routes/properties.py

Public property-listing endpoints. No auth required — these serve the
public Property Details and Listings screens.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.v1.deps import OptionalCurrentUser
from app.core.exceptions import ValidationFailed
from app.core.middleware import limiter
from app.db.session import get_db
from app.models.enums import ListingType, PropertyType
from app.schemas.leads import EnquireRequest, EnquireResponse
from app.schemas.properties import (
    NeighborhoodSummary,
    PropertyCompareResponse,
    PropertyListResponse,
    PropertyRead,
)
from app.services import lead_service, property_service
from app.services.property_service import MAX_COMPARE_IDS, SortOption

router = APIRouter(prefix="/properties", tags=["properties"])


def _parse_compare_ids(raw: str) -> list[UUID]:
    """
    Parses the comma-separated `ids` query param into UUIDs, deduping while
    preserving order. Syntax-level validation only — the max-count product
    rule lives in property_service.compare_properties.
    """
    ids: list[UUID] = []
    for part in (segment.strip() for segment in raw.split(",")):
        if not part:
            continue
        try:
            parsed = UUID(part)
        except ValueError:
            raise ValidationFailed("INVALID_COMPARE_IDS", f"'{part}' is not a valid property id.")
        if parsed not in ids:
            ids.append(parsed)
    return ids


@router.get("", response_model=PropertyListResponse)
def list_properties(
    db: Session = Depends(get_db),
    city: str | None = None,
    locality: str | None = None,
    search: str | None = None,
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
    """The search/listings grid endpoint. Filters are typed query params; unknown `sort` values 422 automatically via the Literal type."""
    items, total = property_service.list_properties(
        db,
        city=city,
        locality=locality,
        search=search,
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


@router.get("/neighborhoods", response_model=list[NeighborhoodSummary])
def list_neighborhoods(
    limit: int = Query(default=4, ge=1, le=12),
    db: Session = Depends(get_db),
) -> list[NeighborhoodSummary]:
    """Top localities by active listing count, for the search overlay's Curated Neighborhoods grid."""
    return property_service.list_neighborhoods(db, limit=limit)


@router.get("/compare", response_model=PropertyCompareResponse)
def compare_properties(
    ids: str = Query(..., description=f"Comma-separated property ids, max {MAX_COMPARE_IDS}"),
    db: Session = Depends(get_db),
) -> PropertyCompareResponse:
    """Returns active properties matching `ids` for the /compare screen's spec table."""
    id_list = _parse_compare_ids(ids)
    properties = property_service.compare_properties(db, id_list)
    return PropertyCompareResponse(items=[PropertyRead.model_validate(p) for p in properties])


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(property_id: UUID, db: Session = Depends(get_db)) -> PropertyRead:
    """Returns an active property's full detail; 404 if missing or not active."""
    property_ = property_service.get_property_detail(db, property_id)
    return PropertyRead.model_validate(property_)


@router.post("/{property_id}/enquire", response_model=EnquireResponse, status_code=201)
@limiter.limit("5/minute")
def enquire_property(
    property_id: UUID,
    payload: EnquireRequest,
    request: Request,
    requester: OptionalCurrentUser,
    db: Session = Depends(get_db),
) -> EnquireResponse:
    """Creates a Lead from the Property Details contact card's two CTAs — works for both
    anonymous and logged-in visitors. On success reveals the broker's phone number, which
    GET /{property_id} never exposes."""
    property_ = property_service.get_property_detail(db, property_id)
    lead = lead_service.create_enquiry(db, property_, requester, payload)
    return EnquireResponse(
        id=lead.id,
        status=lead.status,
        broker_name=property_.broker.full_name,
        broker_phone=property_.broker.phone,
    )
