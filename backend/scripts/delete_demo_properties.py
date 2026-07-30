"""
backend/scripts/delete_demo_properties.py

Deletes the demo listings created by seed_demo_properties.py (cascades
to their property_media rows via ondelete=CASCADE). Leaves the broker
fixture user and the separate create_test_property.py demo listing in
place.

Usage:
    python scripts/delete_demo_properties.py
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/delete_demo_properties.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.property import Property  # noqa: E402
from scripts.seed_demo_properties import DEMO_PROPERTIES  # noqa: E402

TITLES = [entry[0] for entry in DEMO_PROPERTIES]


def delete_demo_properties() -> None:
    db = SessionLocal()
    try:
        deleted = db.query(Property).filter(Property.title.in_(TITLES)).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {deleted} demo property row(s)")
    finally:
        db.close()


if __name__ == "__main__":
    delete_demo_properties()
