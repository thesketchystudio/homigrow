"""
app/schemas/saved_properties.py

Pydantic read shapes for the client watchlist resource.
"""

from datetime import datetime

from app.schemas._pagination import PaginatedResponse
from app.schemas.properties import PropertyListItem


class SavedPropertyItem(PropertyListItem):
    """A saved listing — the same PropertyCard-shaped fields as PropertyListItem, plus when it was saved."""

    saved_at: datetime


class SavedPropertyListResponse(PaginatedResponse[SavedPropertyItem]):
    """Pagination envelope for GET /saved-properties: page/page_size in, total/total_pages computed for the caller."""
