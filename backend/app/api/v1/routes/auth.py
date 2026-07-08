"""
app/api/v1/routes/auth.py

Auth endpoints: signup and login (password path). Routes only
parse/validate input and translate the service result into a response
schema — no business logic here (03_Backend_Architecture.md layering
rules).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, SignupRequest, SignupResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> SignupResponse:
    """Creates a client or broker account and triggers a signup OTP."""
    user = auth_service.signup(
        db,
        phone=payload.phone,
        role=payload.role,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
    )
    return SignupResponse(user_id=user.id)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Authenticates by phone or email + password; enforces lockout."""
    token, user = auth_service.login(db, payload.phone_or_email, payload.password)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))
