import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

def _get_database_url():
    """
    When running as a packaged Electron app, Electron sets BEAM_ERP_DATA_DIR
    to a folder inside AppData. This folder is NEVER overwritten by updates,
    so the database (and all customer data) persists across versions.

    In local development, the database stays in the backend directory.
    """
    data_dir = os.environ.get("BEAM_ERP_DATA_DIR")
    if data_dir:
        os.makedirs(data_dir, exist_ok=True)
        db_path = os.path.join(data_dir, "beam_erp.db")
        return f"sqlite:///{db_path}"
    # Local development fallback
    return "sqlite:///./beam_erp.db"

SQLALCHEMY_DATABASE_URL = _get_database_url()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
