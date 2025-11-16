import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

# Load environment variables from the .env file
load_dotenv()

# --- Configuration ---
# Check for common environment variable names for the PostgreSQL URL
POSTGRES_URL = os.getenv("POSTGRES_URL")
DATABASE_URL = os.getenv("DATABASE_URL")

SQLALCHEMY_DATABASE_URL = POSTGRES_URL or DATABASE_URL

if not SQLALCHEMY_DATABASE_URL:
     raise ValueError(
         "Database URL not found. Please set POSTGRES_URL or DATABASE_URL in your .env file."
     )

# Create the SQLAlchemy engine
# The engine is responsible for talking to the database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True
)

# Base class used by all ORM models (Internship, UserProfile, etc.)
# All your models (in backend/models.py) must inherit from this Base.
Base = declarative_base() 

# Configure the session to interact with the database
# SessionLocal is what you instantiate to get a connection to the DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for FastAPI routes 
def get_db():
    """
    Provides a database session for FastAPI dependency injection.
    This function ensures the database connection is automatically closed 
    after the request is processed.
    """
    db = SessionLocal()
    try:
        # 'yield' makes this function a dependency injection provider
        yield db
    finally:
        # Ensures the session is closed after the request is complete, releasing the connection
        db.close()