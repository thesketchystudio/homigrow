"""
app/services/notification_service.py

Single write entrypoint for the in-app notification feed (see
Notification's own docstring) — every insert goes through
create_notification rather than an inline db.add(Notification(...)).
Write-only on purpose: no read/list endpoints exist yet because nothing
reads notifications today on either side.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification


def create_notification(
    db: Session,
    *,
    user_id: UUID,
    type: NotificationType,
    title: str,
    body: Optional[str] = None,
    data: Optional[dict] = None,
) -> Notification:
    """Builds and stages a Notification row; does not commit — caller controls the transaction boundary."""
    notification = Notification(user_id=user_id, type=type, title=title, body=body, data=data or {})
    db.add(notification)
    return notification
