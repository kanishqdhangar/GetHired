from sqlalchemy.orm import Session
from backend.ml_pipeline.models import Internship, User, Application
from backend.schemas.job import JobCreate 
from backend.crud.job import create_job_with_embedding
from backend.schemas.application import ApplicationStatusUpdate
from typing import List, Optional
from backend.ml_pipeline.embeddings import create_embedding_from_text
# --- Read/View Job Functions ---

def get_job_by_id(db: Session, job_id: int):
    """Retrieves a single job by ID."""
    return db.query(Internship).filter(Internship.id == job_id).first()

def get_jobs_by_recruiter(db: Session, recruiter_id: int):
    """
    Retrieves all internship postings that belong to a specific recruiter ID.
    """
    jobs = db.query(Internship).filter(Internship.recruiter_id == recruiter_id).all()
    return jobs

# --- Update Job Function ---

def update_job(db: Session, job_id: int, job_update: JobCreate, recruiter_id: int):
    """
    Updates a job if it exists and belongs to the given recruiter.
    """
    db_job = db.query(Internship).filter(
        Internship.id == job_id,
        Internship.recruiter_id == recruiter_id 
    ).first()

    if not db_job:
        return None 

    
    job_text = job_update.title + " " + job_update.description
    
    new_embedding = create_embedding_from_text(job_text) 
    
    
    for key, value in job_update.model_dump().items():
        setattr(db_job, key, value)
    
    db_job.embedding = new_embedding
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job
# --- Delete Job Function ---

def delete_job(db: Session, job_id: int, recruiter_id: int):
    """
    Deletes a job if it exists and belongs to the given recruiter.
    Returns True on success, False otherwise.
    """
    db_job = db.query(Internship).filter(
        Internship.id == job_id,
        Internship.recruiter_id == recruiter_id # Ownership check
    ).first()

    if db_job:
        db.delete(db_job)
        db.commit()
        return True
    return False
# View Applications

def get_application_by_id_and_recruiter(db: Session, app_id: int, recruiter_id: int):
    """
    Retrieves an application, ensuring the job linked to it is owned by the recruiter.
    """
    from backend.ml_pipeline.models import Application, Internship # Local imports needed
    
    # Joins Application and Internship tables to check ownership
    return db.query(Application).join(Internship).filter(
        Application.id == app_id,
        Internship.recruiter_id == recruiter_id
    ).first()

def update_application_status(
    db: Session, 
    app_id: int, 
    recruiter_id: int, 
    new_status: str
) -> Application | None:
    """
    Updates the status of an application, but only if the recruiter owns the job.
    
    Returns the updated Application object or None if not found/unauthorized.
    """
    app_to_update = db.query(Application).join(Internship).filter(
        Application.id == app_id,
        Internship.recruiter_id == recruiter_id
    ).first()

    if not app_to_update:
        return None

    ALLOWED_STATUSES = ["Applied", "Interview", "Accepted", "Rejected"]
    if new_status not in ALLOWED_STATUSES:
        raise ValueError(f"Invalid status: Must be one of {ALLOWED_STATUSES}")

    app_to_update.status = new_status
    
    db.commit()
    db.refresh(app_to_update)
    return app_to_update

# --- Fetch Applicants ---

def get_applicants_for_job(db: Session, job_id: int, recruiter_id: int) -> List[Application] | None:
    """
    Retrieves all applications for a given job ID, ensuring the recruiter owns the job.
    """
    
    job = db.query(Internship).filter(
        Internship.id == job_id,
        Internship.recruiter_id == recruiter_id
    ).first()

    if not job:
        
        return None 

    applicants = db.query(Application).filter(Application.job_id == job_id).all()
    
    return applicants