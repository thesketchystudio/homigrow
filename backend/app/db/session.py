"""
app/db/session.py

Creates the SQLAlchemy engine and session factory, and provides the
FastAPI dependency used by routes to obtain a database session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# pool_pre_ping avoids handing out dead connections after Supabase idles
# them out; pool_size/max_overflow keep connection usage within Supabase's cap.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    FastAPI dependency that yields a database session for the lifetime
    of a request and closes it afterward, regardless of outcome.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
