"""
app/services/boost_service.py

Pricing and checkout logic for the broker "Boost Listing" page: the
active plan catalog, and creating a boost order for one of the
broker's own active properties.

No payment gateway is wired yet (deliberate, current scope) — every
order is created and stays in OrderStatus.created; nothing here ever
flips it to paid or activates a boost on the property.
"""

from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.boost import BoostPlan
from app.models.boost_order import BoostOrder
from app.models.enums import PropertyStatus
from app.models.property import Property
from app.models.user import User

# Volume discount by the checkout page's duration step — independent of
# plan tier. Not admin-editable yet (that's the coupon/plan-admin work in
# the deferred payment phase); a fixed table is enough for now.
DURATION_DISCOUNT_PERCENT: dict[int, int] = {7: 0, 15: 10, 30: 20}

GST_PERCENT = Decimal("18")


def _round_rupees(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_pricing(plan: BoostPlan, duration_days: int) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    """Returns (base_amount, discount_amount, gst_amount, total_amount) for a plan + duration."""
    base_amount = Decimal(plan.price) * duration_days
    discount_percent = DURATION_DISCOUNT_PERCENT[duration_days]
    discount_amount = _round_rupees(base_amount * discount_percent / Decimal(100))
    subtotal = base_amount - discount_amount
    gst_amount = _round_rupees(subtotal * GST_PERCENT / Decimal(100))
    total_amount = subtotal + gst_amount
    return base_amount, discount_amount, gst_amount, total_amount


def list_active_plans(db: Session) -> list[BoostPlan]:
    """Returns every active boost plan, cheapest tier first."""
    return db.query(BoostPlan).filter(BoostPlan.is_active.is_(True)).order_by(BoostPlan.price).all()


def _get_boostable_property(db: Session, broker: User, property_id: UUID) -> Property:
    """Loads a property, 404s if missing, 403s if not owned, 409s if not active (only active listings can be boosted)."""
    property_ = db.query(Property).filter(Property.id == property_id).first()
    if property_ is None:
        raise NotFoundError("PROPERTY_NOT_FOUND", "Property not found.")
    if property_.broker_id != broker.id:
        raise ForbiddenError("FORBIDDEN", "You do not have permission to access this property.")
    if property_.status != PropertyStatus.active:
        raise ConflictError("PROPERTY_NOT_ACTIVE", "Only an active listing can be boosted.")
    return property_


def create_order(db: Session, broker: User, property_id: UUID, plan_id: UUID, duration_days: int) -> BoostOrder:
    """Validates ownership/plan, computes and freezes the price breakdown, and persists a "created" order."""
    _get_boostable_property(db, broker, property_id)

    plan = db.query(BoostPlan).filter(BoostPlan.id == plan_id, BoostPlan.is_active.is_(True)).first()
    if plan is None:
        raise NotFoundError("BOOST_PLAN_NOT_FOUND", "This boost plan is not available.")

    base_amount, discount_amount, gst_amount, total_amount = compute_pricing(plan, duration_days)

    order = BoostOrder(
        broker_id=broker.id,
        property_id=property_id,
        plan_id=plan_id,
        duration_days=duration_days,
        base_amount=base_amount,
        discount_amount=discount_amount,
        gst_amount=gst_amount,
        total_amount=total_amount,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
