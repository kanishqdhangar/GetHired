# backend/routers/admin_router.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
# Import the Pydantic schema and database dependency
from schemas.job import JobCreate
from ml_pipeline.db_connector import get_db # Assuming this gets the DB session
# Import the new service function
from crud.job import create_job_with_embedding 
from security.auth import get_current_recruiter
from ml_pipeline.models import User

admin_router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@admin_router.post("/jobs/ingest")
def ingest_job(job: JobCreate, db: Session = Depends(get_db), current_recruiter: User = Depends(get_current_recruiter)):
    """
    Admin endpoint to ingest a new job posting and pre-calculate its embedding.
    """
    recruiter_id = current_recruiter.id

    # Call the service function to handle the business logic (embedding + saving)
    db_job = create_job_with_embedding(db=db, job=job, recruiter_id=recruiter_id)
    
    return {
        "message": f"Job '{db_job.title}' ingested successfully and linked to Recruiter {recruiter_id}.",
            "job_id": db_job.id}