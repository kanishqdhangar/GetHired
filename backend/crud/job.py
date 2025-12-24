from sqlalchemy.orm import Session
from backend.ml_pipeline.models import Internship 
from backend.schemas.job import JobCreate 
from backend.ml_pipeline.embeddings import create_embedding_from_text 

def create_job_with_embedding(db: Session, job: JobCreate, recruiter_id: int):
    """
    Generates an embedding for a job, unpacks all fields from the schema, 
    and saves the job and vector to the database.
    """
    
    job_text = job.title + " " + job.description
    
    job_vector = create_embedding_from_text(job_text)
    
    job_data = job.model_dump()
    
    db_job = Internship(
        **job_data,
        embedding=job_vector,  
        recruiter_id=recruiter_id
    )
    
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    return db_job