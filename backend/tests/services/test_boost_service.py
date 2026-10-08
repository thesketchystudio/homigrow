"""
tests/services/test_boost_service.py

Pricing math (duration discount + GST) and the own/active property
guard for boost order creation.
"""

import uuid
from decimal import Decimal

import pytest

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.boost import BoostPlan
from app.models.enums import BoostTier, ListingType, PropertyStatus, PropertyType, UserRole
from app.models.property import Property
from app.services import boost_service
from tests.conftest import make_user


def _make_broker(db_session, **kwargs):
    return make_user(db_session, role=UserRole.broker, **kwargs)


def _make_plan(db_session, *, price=249, tier=BoostTier.featured) -> BoostPlan:
    plan = BoostPlan(tier=tier, name="Featured", price=price, features=[], reach_estimate={})
    db_session.add(plan)
    db_session.flush()
    return plan


def _make_property(db_session, broker, *, status=PropertyStatus.active, **overrides) -> Property:
    defaults = dict(
        broker_id=broker.id,
        title="2 BHK Modern Flat",
        listing_type=ListingType.sale,
        property_type=PropertyType.apartment,
        status=status,
        price=5000000,
        is_negotiable=False,
        address_line="1 MG Road",
        locality="Koramangala",
        city="Bengaluru",
        state="Karnataka",
        pincode="560034",
    )
    defaults.update(overrides)
    property_ = Property(**defaults)
    db_session.add(property_)
    db_session.flush()
    return property_


class TestComputePricing:
    @pytest.mark.parametrize(
        "duration_days,expected_base,expected_discount,expected_gst,expected_total",
        [
            (7, Decimal("1743"), Decimal("0.00"), Decimal("313.74"), Decimal("2056.74")),
            (15, Decimal("3735"), Decimal("373.50"), Decimal("605.07"), Decimal("3966.57")),
            (30, Decimal("7470"), Decimal("1494.00"), Decimal("1075.68"), Decimal("7051.68")),
        ],
    )
    def test_discount_and_gst_by_duration(
        self, db_session, duration_days, expected_base, expected_discount, expected_gst, expected_total
    ):
        plan = _make_plan(db_session, price=249)
        base, discount, gst, total = boost_service.compute_pricing(plan, duration_days)
        assert base == expected_base
        assert discount == expected_discount
        assert gst == expected_gst
        assert total == expected_total

    def test_seven_days_has_no_discount(self, db_session):
        plan = _make_plan(db_session, price=100)
        base, discount, gst, total = boost_service.compute_pricing(plan, 7)
        assert discount == Decimal("0.00")
        assert total == base + gst


class TestCreateOrder:
    def test_creates_order_with_frozen_pricing(self, db_session):
        broker = _make_broker(db_session)
        property_ = _make_property(db_session, broker)
        plan = _make_plan(db_session, price=249)

        order = boost_service.create_order(db_session, broker, property_.id, plan.id, 15)

        assert order.status.value == "created"
        assert order.duration_days == 15
        assert order.total_amount == Decimal("3966.57")

    def test_404_when_property_missing(self, db_session):
        broker = _make_broker(db_session)
        plan = _make_plan(db_session)
        with pytest.raises(NotFoundError):
            boost_service.create_order(db_session, broker, uuid.uuid4(), plan.id, 7)

    def test_403_when_property_not_owned(self, db_session):
        broker = _make_broker(db_session, phone="+919876500001")
        other_broker = _make_broker(db_session, phone="+919876500002")
        property_ = _make_property(db_session, other_broker)
        plan = _make_plan(db_session)
        with pytest.raises(ForbiddenError):
            boost_service.create_order(db_session, broker, property_.id, plan.id, 7)

    def test_409_when_property_not_active(self, db_session):
        broker = _make_broker(db_session)
        property_ = _make_property(db_session, broker, status=PropertyStatus.draft)
        plan = _make_plan(db_session)
        with pytest.raises(ConflictError):
            boost_service.create_order(db_session, broker, property_.id, plan.id, 7)

    def test_404_when_plan_missing_or_inactive(self, db_session):
        broker = _make_broker(db_session)
        property_ = _make_property(db_session, broker)
        plan = _make_plan(db_session)
        plan.is_active = False
        db_session.flush()
        with pytest.raises(NotFoundError):
            boost_service.create_order(db_session, broker, property_.id, plan.id, 7)
