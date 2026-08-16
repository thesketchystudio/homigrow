"""
app/services/saved_property_service.py

Client watchlist reads and idempotent save/unsave. No status filter on
the listed properties — a saved property stays in the watchlist even if
it later goes off-market, since the row is the user's own save history,
not a public search result.
"""

from typing import Literal, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import PropertyType
from app.models.property import Property
from app.models.saved_property import SavedProperty
from app.schemas.saved_properties import SavedPropertyItem
from app.services._property_query_helpers import build_property_list_item, cover_image_subquery

SavedSortOption = Literal["recent", "price_asc", "price_desc"]

_SORT_CLAUSES = {
    "recent": SavedProperty.created_at.desc(),
    "price_asc": Property.price.asc(),
    "price_desc": Property.price.desc(),
}


def list_saved_properties(
    db: Session,
    user_id: UUID,
    *,
    property_type: Optional[list[PropertyType]] = None,
    sort: SavedSortOption = "recent",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SavedPropertyItem], int]:
    """
    Returns a page of the user's saved properties plus the total count,
    filtered by the Saved screen's category pills and ordered per its sort
    control. `property_type` narrows to the given physical categories
    (the "Villas"/"Commercial" pills); `sort` defaults to newest-saved
    first.
    """
    conditions = [SavedProperty.user_id == user_id]
    if property_type:
        conditions.append(Property.property_type.in_(property_type))

    total = (
        db.query(func.count(SavedProperty.property_id))
        .join(Property, Property.id == SavedProperty.property_id)
        .filter(*conditions)
        .scalar()
    )

    cover_image_subq = cover_image_subquery()

    rows = (
        db.query(SavedProperty, Property, cover_image_subq.label("cover_image_url"))
        .join(Property, Property.id == SavedProperty.property_id)
        .filter(*conditions)
        .order_by(_SORT_CLAUSES[sort])
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        SavedPropertyItem(**build_property_list_item(property_, cover_image_url), saved_at=saved.created_at)
        for saved, property_, cover_image_url in rows
    ]
    return items, total


def save_property(db: Session, user_id: UUID, property_id: UUID) -> None:
    """Idempotent save: no-ops if already saved; 404s if the property doesn't exist at all."""
    exists = db.query(Property.id).filter(Property.id == property_id).first()
    if exists is None:
        raise NotFoundError("PROPERTY_NOT_FOUND", "Property not found.")

    already_saved = (
        db.query(SavedProperty)
        .filter(SavedProperty.user_id == user_id, SavedProperty.property_id == property_id)
        .first()
    )
    if already_saved is not None:
        return

    db.add(SavedProperty(user_id=user_id, property_id=property_id))
    db.commit()


def unsave_property(db: Session, user_id: UUID, property_id: UUID) -> None:
    """Idempotent unsave: no error if the property was never saved."""
    db.query(SavedProperty).filter(
        SavedProperty.user_id == user_id, SavedProperty.property_id == property_id
    ).delete()
    db.commit()
