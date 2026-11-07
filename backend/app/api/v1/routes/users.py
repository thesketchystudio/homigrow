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

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.api.v1.deps import CurrentUser
from app.core.client_ip import get_client_ip
from app.core.config import settings
from app.core.cookies import REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH, set_refresh_cookie
from app.core.middleware import limiter
from app.db.session import get_db
from app.schemas.auth import TokenResponse, UserOut
from app.schemas.users import (
    EmailChangeConfirmRequest,
    EmailChangeRequest,
    PasswordChangeRequest,
    SessionRead,
    UserRead,
    UserUpdateRequest,
)
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
    """Applies only the supplied fields. Email is changed through /me/email-change, not here."""
    updated = user_service.update_me(
        db,
        user,
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        preferences=payload.preferences,
        broker_profile=payload.broker_profile.model_dump(exclude_unset=True) if payload.broker_profile is not None else None,
    )
    return UserRead.model_validate(updated)


@router.patch("/me/password", response_model=TokenResponse)
@limiter.limit("5/minute")
def change_password(
    payload: PasswordChangeRequest,
    request: Request,
    response: Response,
    user: CurrentUser,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Verifies current_password before setting new_password (401 on mismatch,
    423 while locked). Every session is revoked, and the caller gets a fresh
    access token and refresh cookie so they stay signed in on this device.
    """
    access_token, refresh_token = user_service.change_password(
        db,
        user,
        payload.current_password,
        payload.new_password,
        user_agent=request.headers.get("user-agent"),
        ip=get_client_ip(request),
    )
    set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TTL_MIN * 60,
        user=UserOut.model_validate(user),
    )


@router.post("/me/email-change", status_code=204)
@limiter.limit("5/minute")
def request_email_change(
    payload: EmailChangeRequest, request: Request, user: CurrentUser, db: Session = Depends(get_db)
) -> None:
    """Re-authenticates the caller and emails a verification code to the new address."""
    user_service.request_email_change(db, user, payload.new_email, payload.current_password)


@router.post("/me/email-change/confirm", response_model=UserRead)
@limiter.limit("5/minute")
def confirm_email_change(
    payload: EmailChangeConfirmRequest, request: Request, user: CurrentUser, db: Session = Depends(get_db)
) -> UserRead:
    """Swaps the account's email once the verification code(s) are confirmed."""
    updated = user_service.confirm_email_change(db, user, payload.new_email, payload.code, payload.current_email_code)
    return UserRead.model_validate(updated)


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
