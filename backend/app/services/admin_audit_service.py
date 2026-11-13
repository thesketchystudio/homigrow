"""
app/services/admin_audit_service.py

Single write entrypoint for admin_audit_log, plus the read used by the
dashboard's Recent Activity feed. Writes are staged on the caller's
session and never committed here, so the audit row and the change it
records always land in the same transaction: no audit row, no commit.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.admin_audit_log import AdminAuditLog
from app.models.enums import AdminAction, AdminAuditTarget
from app.models.user import User

# Human-readable feed line per action; {label} is the target's display
# name captured in meta at write time, so the feed still reads correctly
# after the target is renamed.
_ACTION_SUMMARIES: dict[str, str] = {
    AdminAction.property_approved.value: "Listing approved: {label}",
    AdminAction.property_rejected.value: "Listing rejected: {label}",
    AdminAction.user_suspended.value: "User suspended: {label}",
    AdminAction.user_reinstated.value: "User reinstated: {label}",
}


def record_admin_action(
    db: Session,
    *,
    admin: User,
    action: AdminAction,
    target_type: AdminAuditTarget,
    target_id: UUID,
    meta: Optional[dict] = None,
) -> AdminAuditLog:
    """Stages an audit row for an admin mutation; the caller commits it together with the change itself."""
    entry = AdminAuditLog(
        admin_id=admin.id,
        action=action.value,
        target_type=target_type.value,
        target_id=target_id,
        meta=meta or {},
    )
    db.add(entry)
    return entry


def describe(entry: AdminAuditLog) -> str:
    """Renders an audit row as one line for the activity feed, falling back to the raw action for unknown kinds."""
    template = _ACTION_SUMMARIES.get(entry.action)
    label = (entry.meta or {}).get("label") or "—"
    return template.format(label=label) if template else entry.action


def list_recent(db: Session, limit: int) -> list[AdminAuditLog]:
    """Most recent audit rows across every admin, newest first."""
    return db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc()).limit(limit).all()


def latest_for_target(db: Session, action: AdminAction, target_type: AdminAuditTarget, target_id: UUID) -> Optional[AdminAuditLog]:
    """The newest audit row of one action against one target, or None."""
    return (
        db.query(AdminAuditLog)
        .filter(
            AdminAuditLog.action == action.value,
            AdminAuditLog.target_type == target_type.value,
            AdminAuditLog.target_id == target_id,
        )
        .order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc())
        .first()
    )
