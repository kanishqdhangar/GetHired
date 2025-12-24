import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

# Load environment variables from the .env file
load_dotenv()



POSTGRES_URL = os.getenv("POSTGRES_URL")
DATABASE_URL = os.getenv("DATABASE_URL")

SQLALCHEMY_DATABASE_URL = POSTGRES_URL or DATABASE_URL

if not SQLALCHEMY_DATABASE_URL:
     raise ValueError(
         "Database URL not found. Please set POSTGRES_URL or DATABASE_URL in your .env file."
     )

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True
)

Base = declarative_base() 

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Provides a database session for FastAPI dependency injection.
    This function ensures the database connection is automatically closed 
    after the request is processed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()