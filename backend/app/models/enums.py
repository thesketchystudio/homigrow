"""
app/models/enums.py

Single source of truth for every domain enum used across the models.
Each enum is mirrored as a native Postgres enum type in the Alembic
migrations. Import these enums everywhere a status, role, or category
value is needed instead of using raw strings.
"""

from enum import Enum


class UserRole(str, Enum):
    """Account type: determines portal access and permissions."""

    client = "client"
    broker = "broker"
    admin = "admin"


class PropertyStatus(str, Enum):
    """Lifecycle stage of a property listing."""

    draft = "draft"
    pending = "pending"
    active = "active"
    sold = "sold"
    rented = "rented"
    expired = "expired"
    rejected = "rejected"


class ListingType(str, Enum):
    """Transaction type a property is listed under."""

    sale = "sale"
    rent = "rent"
    pg = "pg"


class PropertyType(str, Enum):
    """Physical category of a property."""

    apartment = "apartment"
    villa = "villa"
    independent_house = "independent_house"
    plot = "plot"
    land = "land"
    office = "office"
    shop = "shop"
    pg_colive = "pg_colive"


class Furnishing(str, Enum):
    """Furnishing level of a property."""

    unfurnished = "unfurnished"
    semi_furnished = "semi_furnished"
    fully_furnished = "fully_furnished"


class VerificationStatus(str, Enum):
    """Verification state of a broker's identity/credentials."""

    unverified = "unverified"
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class LeadStatus(str, Enum):
    """Stage of a lead within a broker's sales pipeline."""

    new = "new"
    contacted = "contacted"
    site_visit = "site_visit"
    negotiation = "negotiation"
    closed_won = "closed_won"
    closed_lost = "closed_lost"


class NotificationType(str, Enum):
    """Category of an in-app notification, used to route/render it."""

    property_alert = "property_alert"
    price_drop = "price_drop"
    lead_received = "lead_received"
    message = "message"
    listing_status = "listing_status"
    system = "system"


class AlertFrequency(str, Enum):
    """How often a saved property alert should be delivered."""

    instant = "instant"
    daily = "daily"
    weekly = "weekly"


class BoostTier(str, Enum):
    """Paid listing-boost tier."""

    basic = "basic"
    featured = "featured"
    premium = "premium"


class OrderStatus(str, Enum):
    """Payment status of a boost order."""

    created = "created"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class MediaType(str, Enum):
    """Type of a property media asset."""

    image = "image"
    video = "video"


class OTPPurpose(str, Enum):
    """Reason an OTP code was issued."""

    login = "login"
    signup = "signup"
    broker_verification = "broker_verification"


class BrokerDocumentType(str, Enum):
    """
    Kind of a broker verification document. Not a Postgres enum type —
    it only ever appears as the "type" field inside broker_profiles.
    verification_documents (JSONB), never as a table column, so there's
    nothing to migrate.
    """

    rera_certificate = "rera_certificate"
    government_id = "government_id"
