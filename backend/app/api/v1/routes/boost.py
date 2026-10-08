"""
app/api/v1/routes/boost.py

Boost-plan catalog (public) and boost-order checkout (broker-only).
Payment is not wired yet — see app/services/boost_service.py.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireBroker
from app.db.session import get_db
from app.schemas.boost import BoostOrderCreateRequest, BoostOrderRead, BoostPlanRead
from app.services import boost_service

router = APIRouter(tags=["boost"])


@router.get("/boost-plans", response_model=list[BoostPlanRead])
def list_boost_plans(db: Session = Depends(get_db)) -> list[BoostPlanRead]:
    """Lists every active boost plan, cheapest tier first."""
    plans = boost_service.list_active_plans(db)
    return [BoostPlanRead.model_validate(plan) for plan in plans]


@router.post("/boost-orders", response_model=BoostOrderRead, status_code=201)
def create_boost_order(payload: BoostOrderCreateRequest, user: RequireBroker, db: Session = Depends(get_db)) -> BoostOrderRead:
    """Creates a boost order for one of the caller's own active properties; property must be own + active."""
    order = boost_service.create_order(db, user, payload.property_id, payload.plan_id, payload.duration_days)
    return BoostOrderRead.model_validate(order)
