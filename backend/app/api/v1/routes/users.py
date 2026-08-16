"""
app/api/v1/routes/users.py

Self-service account endpoints for the authenticated user: profile
read/update, password change, session listing/revocation, and account
deactivation. Every route depends on CurrentUser — no role restriction,
since these act on the caller's own account regardless of
client/broker/admin. Routes only parse input and translate service
results into responses; the actual rules (email-uniqueness,
deactivation eligibility, etc.) live in user_service.py.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.v1.deps import CurrentUser
from app.core.cookies import REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH
from app.db.session import get_db
from app.schemas.users import PasswordChangeRequest, SessionRead, UserRead, UserUpdateRequest
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser) -> UserRead:
    """Returns the caller's own profile, with broker_profile embedded when role=broker."""
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdateRequest, user: CurrentUser, db: Session = Depends(get_db)
) -> UserRead:
    """Applies only the supplied fields; changing email re-triggers verification."""
    updated = user_service.update_me(
        db,
        user,
        full_name=payload.full_name,
        email=payload.email,
        avatar_url=payload.avatar_url,
        preferences=payload.preferences,
    )
    return UserRead.model_validate(updated)


@router.patch("/me/password", status_code=204)
def change_password(
    payload: PasswordChangeRequest, user: CurrentUser, db: Session = Depends(get_db)
) -> None:
    """Verifies current_password before setting new_password; 401 on mismatch."""
    user_service.change_password(db, user, payload.current_password, payload.new_password)


@router.get("/me/sessions", response_model=list[SessionRead])
def list_sessions(user: CurrentUser, db: Session = Depends(get_db)) -> list[SessionRead]:
    """Lists the caller's active refresh-token sessions (device/ip/created_at), newest first."""
    sessions = user_service.list_sessions(db, user)
    return [SessionRead.model_validate(session) for session in sessions]


@router.delete("/me/sessions/{session_id}", status_code=204)
def revoke_session(session_id: UUID, user: CurrentUser, db: Session = Depends(get_db)) -> None:
    """Revokes one of the caller's own sessions; 404 if the id doesn't belong to them."""
    user_service.revoke_session(db, user, session_id)


@router.post("/me/sessions/revoke-all", status_code=204)
def revoke_all_sessions(user: CurrentUser, db: Session = Depends(get_db)) -> None:
    """Logout-all: revokes every active session for the caller."""
    user_service.revoke_all_sessions(db, user)


@router.post("/me/deactivate", status_code=204)
def deactivate_account(user: CurrentUser, response: Response, db: Session = Depends(get_db)) -> None:
    """Soft-deactivates the account and revokes every session; 409 if a broker has an active listing."""
    user_service.deactivate_account(db, user)
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
