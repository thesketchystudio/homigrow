"""
app/services/_property_query_helpers.py

Shared query-building blocks for the two services that render properties
as "card-shaped" list items (property_service.list_properties and
saved_property_service.list_saved_properties): the correlated cover-image
subquery and the common field mapping onto PropertyListItem/SavedPropertyItem.
"""

from sqlalchemy import select

from app.models.property import Property, PropertyMedia


def cover_image_subquery():
    """
    Correlated subquery selecting a property's single cover-image URL (or
    None if it has none), meant to be added as an extra selected column
    alongside a Property row in a query already filtering on Property.
    """
    return (
        select(PropertyMedia.url)
        .where(PropertyMedia.property_id == Property.id, PropertyMedia.is_cover.is_(True))
        .correlate(Property)
        .limit(1)
        .scalar_subquery()
    )


def build_property_list_item(property_: Property, cover_image_url) -> dict:
    """
    Builds the card-shaped field dict common to PropertyListItem and
    SavedPropertyItem (which extends it with its own saved_at timestamp).
    Returned as a dict rather than a constructed model so each call site
    can pass it straight into its own schema class via **kwargs.
    """
    return dict(
        id=property_.id,
        title=property_.title,
        listing_type=property_.listing_type,
        property_type=property_.property_type,
        price=property_.price,
        bhk=property_.bhk,
        bathrooms=property_.bathrooms,
        area_sqft=property_.area_sqft,
        furnishing=property_.furnishing,
        city=property_.city,
        locality=property_.locality,
        cover_image_url=cover_image_url,
        published_at=property_.published_at,
    )
