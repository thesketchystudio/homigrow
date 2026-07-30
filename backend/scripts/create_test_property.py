"""
backend/scripts/create_test_property.py

Inserts one demo property (+ a broker fixture user, if it doesn't already
exist) directly into the dev database, matching the Figma "property
details" screen's content ("The Obsidian Estate"). Broker property
creation isn't built yet (deferred to a future broker page), so this is
the standing way to get a real, active listing to develop and verify
GET /api/v1/properties/{id} against. Counterpart to
delete_test_property.py; idempotent — re-running with the same title
prints the existing property's id instead of duplicating it.

Usage:
    python scripts/create_test_property.py
"""

import sys
from datetime import datetime, timezone
from pathlib import Path

# Allows running this script directly (`python scripts/create_test_property.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.broker_profile import BrokerProfile  # noqa: E402
from app.models.enums import (  # noqa: E402
    ListingType,
    MediaType,
    PropertyStatus,
    PropertyType,
    UserRole,
    VerificationStatus,
)
from app.models.property import Property, PropertyMedia  # noqa: E402
from app.models.user import User  # noqa: E402

DEFAULT_BROKER_EMAIL = "vikram.broker.test@homigrow.local"
DEFAULT_BROKER_PHONE = "9900011122"
DEFAULT_BROKER_NAME = "Vikram Sethi"
DEFAULT_BROKER_PASSWORD = "Preetham-test"

DEFAULT_TITLE = "The Obsidian Estate"
DEFAULT_DESCRIPTION = (
    "A monolithic statement in stone and glass, The Obsidian Estate redefines "
    "urban sanctuary in the heart of Bengaluru's most coveted zip code.\n\n"
    "Designed by the award-winning Praxis Studio, this residence is a "
    "masterclass in Brutalist elegance tempered by tropical lushness. The "
    "exterior, clad in hand-honed basalt, creates a dramatic silhouette that "
    "evolves with the movement of the sun."
)
DEFAULT_AMENITIES = [
    "Private Infinity Pool",
    "4K Home Cinema",
    "Smart Ecosystem",
    "Zen Gardens",
    "Chef's Kitchen",
    "Biometric Security",
    "Private Studio",
    "EV Infrastructure",
]
# Stable placeholder images — no media-upload pipeline (R2/Cloudflare Stream)
# exists yet (10_Phase_3.md P3-T20), so this seed data just points at plain
# static URLs rather than anything uploaded through the app.
DEFAULT_MEDIA = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600",
]


def _get_or_create_broker(db) -> User:
    broker = db.query(User).filter(User.email == DEFAULT_BROKER_EMAIL).first()
    if broker is not None:
        return broker

    broker = User(
        phone=DEFAULT_BROKER_PHONE,
        email=DEFAULT_BROKER_EMAIL,
        password_hash=hash_password(DEFAULT_BROKER_PASSWORD),
        full_name=DEFAULT_BROKER_NAME,
        role=UserRole.broker,
        is_email_verified=True,
    )
    db.add(broker)
    db.flush()

    db.add(
        BrokerProfile(
            user_id=broker.id,
            verification_status=VerificationStatus.verified,
            company_name="Curator Elite",
        )
    )
    return broker


def create_test_property() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Property).filter(Property.title == DEFAULT_TITLE).first()
        if existing is not None:
            print(f"Property already exists: {existing.id}")
            return

        broker = _get_or_create_broker(db)

        property_ = Property(
            broker_id=broker.id,
            title=DEFAULT_TITLE,
            description=DEFAULT_DESCRIPTION,
            listing_type=ListingType.rent,
            property_type=PropertyType.villa,
            status=PropertyStatus.active,
            price=245000,
            maintenance_monthly=15000,
            is_negotiable=False,
            bhk=4,
            bathrooms=5,
            area_sqft=4500,
            built_year=2022,
            parking_slots=3,
            amenities=DEFAULT_AMENITIES,
            address_line="100 Ft Road, Indiranagar",
            locality="Indiranagar",
            city="Bengaluru",
            state="Karnataka",
            pincode="560038",
            metro_distance_m=3000,
            published_at=datetime.now(timezone.utc),
        )
        db.add(property_)
        db.flush()

        for position, url in enumerate(DEFAULT_MEDIA):
            db.add(
                PropertyMedia(
                    property_id=property_.id,
                    media_type=MediaType.image,
                    url=url,
                    position=position,
                    is_cover=(position == 0),
                )
            )

        db.commit()
        print(f"Created property {property_.id} ({DEFAULT_TITLE!r}, broker={DEFAULT_BROKER_EMAIL})")
    finally:
        db.close()


if __name__ == "__main__":
    create_test_property()
