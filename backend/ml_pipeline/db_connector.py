import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found. Make sure it's set in your .env file.")

# Create SQLAlchemy engine
db = create_engine(DATABASE_URL)

# def fetch_jobs_from_db():
#     query = "SELECT job_id, title, skills, about, requirements FROM jobs;"
#     df = pd.read_sql(query, db)
#     return df
