"""
app/services/lead_service.py

Property-enquiry creation for the Property Contact Card's two CTAs
(Schedule Private Tour / Get Number). Works for anonymous and logged-in
visitors alike.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.models.enums import LeadStatus, NotificationType
from app.models.lead import Lead
from app.models.property import Property
from app.models.user import User
from app.schemas.leads import EnquireRequest
from app.services import notification_service

_OPEN_STATUSES_EXCLUDED = (LeadStatus.closed_won, LeadStatus.closed_lost)
_SOURCE_LABELS = {"tour_request": "requested a private tour", "number_request": "requested your number"}


def _has_open_lead(db: Session, property_id: UUID, *, client_id: Optional[UUID], contact_phone: Optional[str]) -> bool:
    query = db.query(Lead.id).filter(
        Lead.property_id == property_id,
        Lead.status.notin_(_OPEN_STATUSES_EXCLUDED),
    )
    query = query.filter(Lead.client_id == client_id) if client_id is not None else query.filter(Lead.contact_phone == contact_phone)
    return query.first() is not None


def create_enquiry(db: Session, property: Property, requester: Optional[User], data: EnquireRequest) -> Lead:
    """
    Creates a Lead for `property` from either an anonymous visitor or a
    logged-in client. Dedupes against the requester's own still-open lead on
    this property (open = status not in closed_won/closed_lost): keyed by
    client_id when logged in, by contact_phone when anonymous — an
    anonymous visitor has no other stable identity to key on. Raises
    ConflictError on collision.
    """
    client_id = requester.id if requester else None
    if _has_open_lead(db, property.id, client_id=client_id, contact_phone=None if requester else data.phone):
        raise ConflictError("LEAD_ALREADY_OPEN", "You already have an open enquiry for this property.")

    message = data.message
    if data.preferred_date:
        prefix = f"Preferred tour date: {data.preferred_date.isoformat()}"
        message = f"{prefix}\n\n{message}" if message else prefix

    lead = Lead(
        property_id=property.id,
        client_id=client_id,
        broker_id=property.broker_id,
        source=data.source,
        message=message,
        contact_name=data.name,
        contact_phone=data.phone,
    )
    db.add(lead)
    db.flush()  # assigns lead.id for the notification payload

    notification_service.create_notification(
        db,
        user_id=property.broker_id,
        type=NotificationType.lead_received,
        title=f"New enquiry on {property.title}",
        body=f"{data.name} ({data.phone}) — {_SOURCE_LABELS[data.source]}",
        data={"lead_id": str(lead.id), "property_id": str(property.id)},
    )

    db.commit()
    db.refresh(lead)
    return lead
