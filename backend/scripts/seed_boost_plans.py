"""
backend/scripts/seed_boost_plans.py

Inserts the three boost plans shown on the Figma "Boost Listing" page
(node 178:5300) into boost_plans, idempotent per tier — running this
twice updates the existing rows instead of duplicating them, so it's
safe to re-run after tweaking copy/pricing here.

Usage:
    python scripts/seed_boost_plans.py
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/seed_boost_plans.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.boost import BoostPlan  # noqa: E402
from app.models.enums import BoostTier  # noqa: E402

# (tier, name, price_per_day, features, reach_estimate)
BOOST_PLANS = [
    (
        BoostTier.basic,
        "Basic Boost",
        99,
        [
            "Listed in Top 20 search results",
            "Highlighted listing card",
            "Standard reach (~800 views)",
            "Email lead alerts",
        ],
        {"views_min": 800, "views_max": 1200, "leads_min": 6, "leads_max": 12, "calls_min": 2, "calls_max": 5},
    ),
    (
        BoostTier.featured,
        "Featured",
        249,
        [
            "Top 5 search placement",
            '"Featured" badge on listing',
            "High reach (~3,000 views)",
            "SMS + Email lead alerts",
            "Shared on social feeds",
        ],
        {"views_min": 3000, "views_max": 5000, "leads_min": 28, "leads_max": 45, "calls_min": 14, "calls_max": 22},
    ),
    (
        BoostTier.premium,
        "Premium Spotlight",
        549,
        [
            "#1 search result placement",
            "Homepage banner feature",
            "Maximum reach (~8,000 views)",
            "Priority lead notifications",
            "Instagram + Facebook ads",
            "Dedicated performance report",
        ],
        {"views_min": 8000, "views_max": 12000, "leads_min": 60, "leads_max": 90, "calls_min": 30, "calls_max": 48},
    ),
]


def seed_boost_plans() -> None:
    db = SessionLocal()
    try:
        for tier, name, price, features, reach_estimate in BOOST_PLANS:
            plan = db.query(BoostPlan).filter(BoostPlan.tier == tier).first()
            if plan is None:
                plan = BoostPlan(tier=tier)
                db.add(plan)
            plan.name = name
            plan.price = price
            plan.features = features
            plan.reach_estimate = reach_estimate
            plan.is_active = True
        db.commit()
        print(f"Seeded {len(BOOST_PLANS)} boost plan(s)")
    finally:
        db.close()


if __name__ == "__main__":
    seed_boost_plans()
