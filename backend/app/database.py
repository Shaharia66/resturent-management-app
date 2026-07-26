import time

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

from app.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_recycle=280)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def wait_for_db(retries: int = 30, delay: int = 2):
    """Retry DB connection until MySQL container is ready."""
    for attempt in range(retries):
        try:
            conn = engine.connect()
            conn.close()
            return
        except OperationalError:
            time.sleep(delay)
    raise RuntimeError("Could not connect to MySQL after multiple retries")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
