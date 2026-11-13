"""
app/api/v1/routes/admin.py

Admin portal endpoints under /api/v1/admin. Every route requires
RequireAdmin (403 for any other role), and every mutation writes its
admin_audit_log row in the same transaction as the change. The admin
sign-in lives with the other auth routes at POST /auth/admin/login.
"""

from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireAdmin
from app.db.session import get_db
from app.models.enums import PropertyStatus, UserRole
from app.schemas.admin import (
    AdminModerationStats,
    AdminPropertyList,
    AdminSummary,
    AdminUserDetail,
    AdminUserList,
    ModerateRequest,
    SuspendRequest,
)
from app.schemas.properties import PropertyRead
from app.services import admin_dashboard_service, admin_property_service, admin_user_service

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_PAGE_SIZE = 100


@router.get("/summary", response_model=AdminSummary)
def get_summary(admin: RequireAdmin, db: Session = Depends(get_db)) -> AdminSummary:
    """Dashboard KPIs, traffic series, type distribution, latest listings and recent admin activity."""
    return admin_dashboard_service.get_summary(db)


@router.get("/properties", response_model=AdminPropertyList)
def list_properties(
    admin: RequireAdmin,
    db: Session = Depends(get_db),
    status: Optional[PropertyStatus] = None,
    q: Optional[str] = Query(default=None, max_length=100),
    broker_id: Optional[UUID] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=MAX_PAGE_SIZE),
) -> AdminPropertyList:
    """Every listing in any status, filterable by status/search/broker; status=pending is the Review Queue."""
    return admin_property_service.list_properties(
        db, status=status, q=q, broker_id=broker_id, page=page, page_size=page_size
    )


@router.get("/properties/moderation-stats", response_model=AdminModerationStats)
def get_moderation_stats(admin: RequireAdmin, db: Session = Depends(get_db)) -> AdminModerationStats:
    """Review Queue counters: awaiting review now, approved and rejected today (IST)."""
    return admin_property_service.moderation_stats(db)


@router.post("/properties/{property_id}/moderate", response_model=PropertyRead)
def moderate_property(
    property_id: UUID,
    data: ModerateRequest,
    admin: RequireAdmin,
    db: Session = Depends(get_db),
) -> PropertyRead:
    """Approves or rejects a pending listing (a reject needs a note); 409 if it is no longer pending."""
    return admin_property_service.moderate_property(db, admin, property_id, data)


@router.get("/users", response_model=AdminUserList)
def list_users(
    admin: RequireAdmin,
    db: Session = Depends(get_db),
    role: Optional[Literal["client", "broker"]] = None,
    q: Optional[str] = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=MAX_PAGE_SIZE),
) -> AdminUserList:
    """Client and broker accounts (never admins) with the header stats."""
    return admin_user_service.list_users(
        db, role=UserRole(role) if role else None, q=q, page=page, page_size=page_size
    )


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user(user_id: UUID, admin: RequireAdmin, db: Session = Depends(get_db)) -> AdminUserDetail:
    """One client/broker account's profile and totals; admins and unknown ids are 404."""
    return admin_user_service.get_user(db, user_id)


@router.post("/users/{user_id}/suspend", response_model=AdminUserDetail)
def suspend_user(user_id: UUID, data: SuspendRequest, admin: RequireAdmin, db: Session = Depends(get_db)) -> AdminUserDetail:
    """Suspends an account: signs it out everywhere and takes its live listings off the market."""
    return admin_user_service.suspend_user(db, admin, user_id, data.reason)


@router.post("/users/{user_id}/reinstate", response_model=AdminUserDetail)
def reinstate_user(user_id: UUID, admin: RequireAdmin, db: Session = Depends(get_db)) -> AdminUserDetail:
    """Lifts a suspension and restores the listings it took down."""
    return admin_user_service.reinstate_user(db, admin, user_id)
