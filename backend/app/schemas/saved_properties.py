"""
app/schemas/saved_properties.py

Pydantic read shapes for the client watchlist resource (05_API_Design.md
§saved-properties; 10_Phase_3.md P3-T40).
"""

from datetime import datetime

from pydantic import BaseModel, computed_field

from app.schemas.properties import PropertyListItem


class SavedPropertyItem(PropertyListItem):
    """A saved listing — the same PropertyCard-shaped fields as PropertyListItem, plus when it was saved."""

    saved_at: datetime


class SavedPropertyListResponse(BaseModel):
    """Pagination envelope for GET /saved-properties (same page/page_size convention as PropertyListResponse)."""

    items: list[SavedPropertyItem]
    page: int
    page_size: int
    total: int

    @computed_field
    @property
    def total_pages(self) -> int:
        if self.page_size <= 0:
            return 0
        return -(-self.total // self.page_size)
