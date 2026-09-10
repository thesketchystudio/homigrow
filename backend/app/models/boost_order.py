"""
app/models/boost_order.py

A broker's checkout attempt to boost one property listing under a
chosen plan and duration. Created in "created" status with the price
breakdown already computed and frozen (a later admin price change to
the plan must not alter an existing order's amount).

Payment capture is not wired yet (product decision — Razorpay
integration is a separate, later task): there is no razorpay_order_id/
razorpay_payment_id here, and starts_at/ends_at stay NULL forever until
that lands, since nothing ever flips an order to "paid" or activates
the boost on the property yet.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, SmallInteger, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin
from app.models._helpers import _pg_enum
from app.models.enums import OrderStatus


class BoostOrder(Base, TimestampMixin):
    """A checkout attempt to boost one property listing for a chosen plan and duration."""

    __tablename__ = "boost_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    broker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("boost_plans.id"), nullable=False)

    duration_days = Column(SmallInteger, nullable=False)
    # Frozen price breakdown at order-create time, in rupees (not the
    # integer-paise math the real billing service will need once coupons
    # and Razorpay land — there's no money actually moving yet).
    base_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), nullable=False, server_default=text("0"))
    gst_amount = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)

    status = Column(_pg_enum(OrderStatus, "order_status"), nullable=False, server_default=OrderStatus.created.value)
    # Set when payment capture activates the boost; NULL until then (always,
    # for now — see the module docstring).
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)

    broker = relationship("User")
    property = relationship("Property")
    plan = relationship("BoostPlan")

    __table_args__ = (
        Index("ix_boost_orders_broker_created", "broker_id", "created_at"),
        Index("ix_boost_orders_property_status", "property_id", "status"),
    )
