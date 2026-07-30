"""
backend/scripts/delete_test_property.py

Deletes the demo property created by create_test_property.py (cascades
to its property_media rows via ondelete=CASCADE). Leaves the broker
fixture user in place so re-running create_test_property.py stays fast
and idempotent across runs.

Usage:
    python scripts/delete_test_property.py
"""

import sys
from pathlib import Path

# Allows running this script directly (`python scripts/delete_test_property.py`)
# without needing the backend root on PYTHONPATH already.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.property import Property  # noqa: E402

DEFAULT_TITLE = "The Obsidian Estate"


def delete_test_property(title: str = DEFAULT_TITLE) -> None:
    db = SessionLocal()
    try:
        deleted = db.query(Property).filter(Property.title == title).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {deleted} property row(s) titled {title!r}")
    finally:
        db.close()


if __name__ == "__main__":
    delete_test_property(sys.argv[1] if len(sys.argv) == 2 else DEFAULT_TITLE)
