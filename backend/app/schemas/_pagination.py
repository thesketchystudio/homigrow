"""
app/schemas/_pagination.py

Shared pagination envelope for list-response schemas (GET /properties,
GET /saved-properties): items/page/page_size/total in, with total_pages
computed from page_size/total so every paginated endpoint derives it the
same way.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, computed_field

ItemT = TypeVar("ItemT")


class PaginatedResponse(BaseModel, Generic[ItemT]):
    """Pagination envelope: items/page/page_size/total in, total_pages computed for the caller."""

    items: list[ItemT]
    page: int
    page_size: int
    total: int

    @computed_field
    @property
    def total_pages(self) -> int:
        if self.page_size <= 0:
            return 0
        return -(-self.total // self.page_size)
