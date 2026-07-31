"""
backend/scripts/seed_demo_properties.py

Inserts a handful of varied, active demo listings directly into the dev
database, spanning multiple cities/prices/listing types/property types so
the /properties search grid and its filters (P3-T10) have something real
to query beyond the single Property Details demo listing
(create_test_property.py). Reuses the same standing broker fixture.
Idempotent per title, like create_test_property.py; counterpart is
delete_demo_properties.py.

Usage:
    python scripts/seed_demo_properties.py
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Allows running this script directly (`python scripts/seed_demo_properties.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.broker_profile import BrokerProfile  # noqa: E402
from app.models.enums import (  # noqa: E402
    Furnishing,
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

# (title, description, listing_type, property_type, price, bhk, bathrooms,
#  area_sqft, furnishing, city, locality, state, pincode, amenities, image)
#
# `description` follows the same two-paragraph shape as
# create_test_property.py's DEFAULT_DESCRIPTION (a short "hook" line, a
# blank line, then a supporting detail paragraph) — PropertyDescription.tsx
# splits on the blank line and renders the first paragraph as the large
# "Overview" heading text, the rest as body copy. Previously these all
# used a generic "{title} — a curated Homigrow listing in {locality},
# {city}." placeholder, which left the Overview section on the frontend
# looking like unfinished filler text for every demo listing except the
# separately-authored "The Obsidian Estate".
DEMO_PROPERTIES = [
    (
        "Emerald Heights Apartment",
        "A warm, light-filled apartment residence in the heart of "
        "Indiranagar, built for elevated everyday living.\n\n"
        "Floor-to-ceiling glazing and cross-ventilated layouts keep every "
        "room bright, while a private balcony frames the neighbourhood's "
        "signature tree canopy.",
        ListingType.sale,
        PropertyType.apartment,
        18000000,
        3,
        3,
        1800,
        Furnishing.semi_furnished,
        "Bengaluru",
        "Indiranagar",
        "Karnataka",
        "560038",
        ["Swimming pool", "Gym", "Metro station"],
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    ),
    (
        "Whitefield Tech Loft",
        "A compact, fully-furnished loft engineered for Bengaluru's tech "
        "corridor.\n\n"
        "Efficient space planning, built-in storage and a dedicated work "
        "nook make it a turnkey base for professionals who value function "
        "as much as form.",
        ListingType.rent,
        PropertyType.apartment,
        45000,
        2,
        2,
        1100,
        Furnishing.fully_furnished,
        "Bengaluru",
        "Whitefield",
        "Karnataka",
        "560066",
        ["Gym", "Metro station"],
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    ),
    (
        "Marine Drive Residency",
        "A sea-facing residence on one of Mumbai's most storied "
        "addresses.\n\n"
        "Sweeping windows turn every sunset into part of the architecture, "
        "while generous living spaces and a restrained material palette "
        "let the Arabian Sea remain the real centrepiece.",
        ListingType.sale,
        PropertyType.apartment,
        65000000,
        4,
        4,
        2400,
        Furnishing.fully_furnished,
        "Mumbai",
        "Marine Lines",
        "Maharashtra",
        "400002",
        ["Swimming pool", "Sea view"],
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
    ),
    (
        "Bandra Garden Villa",
        "A private-garden villa tucked away from Bandra West's busy "
        "lanes.\n\n"
        "Timber accents and open courtyards soften the urban edge, "
        "creating a home that feels more coastal retreat than city "
        "rental.",
        ListingType.rent,
        PropertyType.villa,
        120000,
        5,
        5,
        3800,
        Furnishing.semi_furnished,
        "Mumbai",
        "Bandra West",
        "Maharashtra",
        "400050",
        ["Swimming pool", "Private Garden"],
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
    ),
    (
        "Vasant Vihar Independent House",
        "A stately independent house in one of Delhi's most established "
        "residential enclaves.\n\n"
        "Wide verandas and a mature private garden give the property a "
        "settled, generational character rare this close to the city "
        "centre.",
        ListingType.sale,
        PropertyType.independent_house,
        42000000,
        4,
        4,
        3200,
        Furnishing.unfurnished,
        "Delhi",
        "Vasant Vihar",
        "Delhi",
        "110057",
        ["Private Garden", "Parking"],
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
    ),
    (
        "Cyber City Co-living PG",
        "A co-living residence designed for Gurugram's always-on Cyber "
        "City crowd.\n\n"
        "Private rooms open onto shared lounges built for both focus and "
        "downtime, with meals, Wi-Fi and housekeeping handled so residents "
        "can spend their energy elsewhere.",
        ListingType.pg,
        PropertyType.pg_colive,
        18000,
        None,
        1,
        250,
        Furnishing.fully_furnished,
        "Gurugram",
        "Sector 24",
        "Haryana",
        "122002",
        ["Wifi", "Meals Included", "Metro station"],
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    ),
    (
        "Koregaon Park Retail Space",
        "A ground-floor retail space on one of Koregaon Park's busiest "
        "commercial stretches.\n\n"
        "Wide frontage and an open floor plate leave the layout ready for "
        "almost any format, from flagship store to café.",
        ListingType.sale,
        PropertyType.shop,
        21000000,
        None,
        1,
        900,
        Furnishing.unfurnished,
        "Pune",
        "Koregaon Park",
        "Maharashtra",
        "411001",
        ["Metro station"],
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    ),
    (
        "HITEC City Office Suite",
        "A move-in-ready office suite at the centre of Hyderabad's HITEC "
        "City.\n\n"
        "Efficient cabin-and-bay planning and dedicated parking keep the "
        "daily commute simple for teams that have outgrown co-working.",
        ListingType.rent,
        PropertyType.office,
        85000,
        None,
        2,
        2200,
        Furnishing.semi_furnished,
        "Hyderabad",
        "HITEC City",
        "Telangana",
        "500081",
        ["Parking", "Metro station"],
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
    ),
    (
        "ECR Beachside Plot",
        "A rare beachside plot along Chennai's East Coast Road, ready for "
        "a custom build.\n\n"
        "Clear title and an open canvas make this one for buyers who want "
        "to design their own coastal retreat from the ground up, with the "
        "Bay of Bengal as its backdrop.",
        ListingType.sale,
        PropertyType.plot,
        9500000,
        None,
        None,
        4800,
        None,
        "Chennai",
        "ECR",
        "Tamil Nadu",
        "600041",
        [],
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
    ),
    (
        "Sarjapur Modern Villa",
        "A clean-lined, glass-forward villa built for Bengaluru's "
        "tech-adjacent Sarjapur Road corridor.\n\n"
        "A private garden and pool wrap around double-height living "
        "spaces, giving the interiors an unusually generous sense of "
        "scale for the neighbourhood.",
        ListingType.sale,
        PropertyType.villa,
        35000000,
        4,
        4,
        3600,
        Furnishing.semi_furnished,
        "Bengaluru",
        "Sarjapur Road",
        "Karnataka",
        "560035",
        ["Swimming pool", "Private Garden", "Metro station"],
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200",
    ),
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


def seed_demo_properties() -> None:
    db = SessionLocal()
    try:
        broker = _get_or_create_broker(db)
        now = datetime.now(timezone.utc)

        created = 0
        for index, (
            title,
            description,
            listing_type,
            property_type,
            price,
            bhk,
            bathrooms,
            area_sqft,
            furnishing,
            city,
            locality,
            state,
            pincode,
            amenities,
            image_url,
        ) in enumerate(DEMO_PROPERTIES):
            if db.query(Property).filter(Property.title == title).first() is not None:
                print(f"Skipping (already exists): {title!r}")
                continue

            property_ = Property(
                broker_id=broker.id,
                title=title,
                description=description,
                listing_type=listing_type,
                property_type=property_type,
                status=PropertyStatus.active,
                price=price,
                is_negotiable=False,
                bhk=bhk,
                bathrooms=bathrooms,
                area_sqft=area_sqft,
                furnishing=furnishing,
                amenities=amenities,
                address_line=f"{locality}, {city}",
                locality=locality,
                city=city,
                state=state,
                pincode=pincode,
                # Staggered so "newest" sort has a real, distinct order across the seed set.
                published_at=now - timedelta(hours=index),
            )
            db.add(property_)
            db.flush()

            db.add(
                PropertyMedia(
                    property_id=property_.id,
                    media_type=MediaType.image,
                    url=image_url,
                    position=0,
                    is_cover=True,
                )
            )
            created += 1
            print(f"Created property {property_.id} ({title!r})")

        db.commit()
        print(f"Done: {created} new / {len(DEMO_PROPERTIES) - created} already present")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_properties()
