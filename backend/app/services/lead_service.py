"""
app/services/lead_service.py

Property-enquiry creation for the Property Contact Card's two CTAs
(Schedule Private Tour / Get Number), plus the broker-facing lead
pipeline: listing a broker's own leads, viewing one in detail, updating
its status/follow-up date, and logging notes against it.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import LeadStatus, NotificationType
from app.models.lead import Lead, LeadNote
from app.models.property import Property
from app.models.user import User
from app.schemas.leads import EnquireRequest, LeadDetail, LeadListItem, LeadNoteRead, LeadUpdateRequest
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


def _to_list_item(lead: Lead) -> LeadListItem:
    """Flattens a Lead (with `property`/`notes` already loaded) into the broker pipeline's list shape."""
    last_note = lead.notes[-1] if lead.notes else None
    return LeadListItem(
        id=lead.id,
        status=lead.status,
        source=lead.source,
        contact_name=lead.contact_name,
        contact_phone=lead.contact_phone,
        message=lead.message,
        follow_up_at=lead.follow_up_at,
        created_at=lead.created_at,
        last_contacted_at=last_note.created_at if last_note else None,
        property_id=lead.property.id,
        property_title=lead.property.title,
        property_locality=lead.property.locality,
        property_city=lead.property.city,
        property_price=float(lead.property.price),
        property_listing_type=lead.property.listing_type,
    )


def _get_owned_lead(db: Session, broker_id: UUID, lead_id: UUID) -> Lead:
    lead = (
        db.query(Lead)
        .options(joinedload(Lead.property), joinedload(Lead.notes).joinedload(LeadNote.author))
        .filter(Lead.id == lead_id, Lead.broker_id == broker_id)
        .first()
    )
    if lead is None:
        raise NotFoundError("LEAD_NOT_FOUND", "Lead not found.")
    return lead


def list_leads_for_broker(db: Session, broker_id: UUID) -> list[LeadListItem]:
    """Lists every lead across the broker's properties, newest first — backs the Leads pipeline table."""
    leads = (
        db.query(Lead)
        .options(joinedload(Lead.property), joinedload(Lead.notes))
        .filter(Lead.broker_id == broker_id)
        .order_by(Lead.created_at.desc())
        .all()
    )
    return [_to_list_item(lead) for lead in leads]


def get_lead_for_broker(db: Session, broker_id: UUID, lead_id: UUID) -> LeadDetail:
    """Returns one lead with its full note history; 404 if it doesn't exist or isn't this broker's."""
    lead = _get_owned_lead(db, broker_id, lead_id)
    return LeadDetail(
        **_to_list_item(lead).model_dump(),
        notes=[
            LeadNoteRead(id=note.id, body=note.body, author_name=note.author.full_name, created_at=note.created_at)
            for note in lead.notes
        ],
    )


def update_lead(db: Session, broker_id: UUID, lead_id: UUID, data: LeadUpdateRequest) -> LeadListItem:
    """Updates a lead's pipeline status and/or follow-up date; 404 if it isn't this broker's."""
    lead = _get_owned_lead(db, broker_id, lead_id)
    if data.status is not None:
        lead.status = data.status
    if data.follow_up_at is not None:
        lead.follow_up_at = data.follow_up_at
    db.commit()
    db.refresh(lead)
    return _to_list_item(lead)


def add_lead_note(db: Session, broker_id: UUID, lead_id: UUID, author: User, body: str) -> LeadNoteRead:
    """Appends a note to a lead's history; 404 if it isn't this broker's."""
    lead = _get_owned_lead(db, broker_id, lead_id)
    note = LeadNote(lead_id=lead.id, author_id=author.id, body=body)
    db.add(note)
    db.commit()
    db.refresh(note)
    return LeadNoteRead(id=note.id, body=note.body, author_name=author.full_name, created_at=note.created_at)
