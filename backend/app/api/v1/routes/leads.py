"""
app/api/v1/routes/leads.py

Broker-authenticated lead pipeline: list every lead across the broker's
own properties, view one in detail with its note history, update its
status/follow-up date, and log a new note. Distinct from routes/properties.py's
POST /properties/{id}/enquire, which creates a Lead and needs no auth at all.
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireBroker
from app.db.session import get_db
from app.schemas.leads import LeadDetail, LeadListItem, LeadNoteCreateRequest, LeadNoteRead, LeadUpdateRequest
from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["leads", "broker"])


@router.get("", response_model=list[LeadListItem])
def list_leads(
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> list[LeadListItem]:
    """Lists every lead across the calling broker's properties, newest first."""
    return lead_service.list_leads_for_broker(db, user.id)


@router.get("/{lead_id}", response_model=LeadDetail)
def get_lead(
    lead_id: UUID,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> LeadDetail:
    """Returns one lead with its full note history; 404 if it isn't owned by the caller."""
    return lead_service.get_lead_for_broker(db, user.id, lead_id)


@router.patch("/{lead_id}", response_model=LeadListItem)
def update_lead(
    lead_id: UUID,
    data: LeadUpdateRequest,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> LeadListItem:
    """Updates a lead's pipeline status and/or follow-up date; 404 if it isn't owned by the caller."""
    return lead_service.update_lead(db, user.id, lead_id, data)


@router.post("/{lead_id}/notes", response_model=LeadNoteRead)
def add_lead_note(
    lead_id: UUID,
    data: LeadNoteCreateRequest,
    user: RequireBroker,
    db: Session = Depends(get_db),
) -> LeadNoteRead:
    """Appends a note to a lead's history; 404 if it isn't owned by the caller."""
    return lead_service.add_lead_note(db, user.id, lead_id, user, data.body)
