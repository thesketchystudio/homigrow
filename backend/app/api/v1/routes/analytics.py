"""
app/api/v1/routes/analytics.py

Broker-authenticated performance analytics — KPIs, trend, and
breakdowns across a broker's own listings and leads. Backs the
Analytics page.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.deps import RequireBroker
from app.db.session import get_db
from app.schemas.analytics import AnalyticsRange, BrokerAnalyticsResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/broker", response_model=BrokerAnalyticsResponse)
def get_broker_analytics(
    user: RequireBroker,
    range: AnalyticsRange = Query(default="30d"),
    db: Session = Depends(get_db),
) -> BrokerAnalyticsResponse:
    """Returns KPIs, trend, and breakdowns across the calling broker's own properties and leads."""
    return analytics_service.get_broker_analytics(db, user, range)
