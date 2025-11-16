from sqlalchemy.orm import Session
# The models are directly under 'backend'
from backend.ml_pipeline.models import Internship 
# The schema is directly under 'backend/schemas'
from backend.schemas.job import JobCreate 
# Assuming your ML function is defined here
from backend.ml_pipeline.embeddings import create_embedding_from_text 

def create_job_with_embedding(db: Session, job: JobCreate, recruiter_id: int):
    """
    Generates an embedding for a job, unpacks all fields from the schema, 
    and saves the job and vector to the database.
    """
    # 1. Prepare Text for Embedding (using both title and description for context)
    job_text = job.title + " " + job.description
    
    # 2. Generate the Vector Embedding
    # The ML model creates the numerical representation of the job description
    job_vector = create_embedding_from_text(job_text)
    
    # 3. Prepare data for SQLAlchemy using Pydantic's model_dump()
    # model_dump() converts the Pydantic object into a dictionary, 
    # including title, description, and the required_skills list.
    job_data = job.model_dump()
    
    # 4. Create the Database Object
    # We unpack all fields from job_data using '**' and explicitly add the embedding.
    db_job = Internship(
        **job_data,
        embedding=job_vector,  # Overrides/adds the calculated embedding vector
        recruiter_id=recruiter_id
    )
    
    # 5. Save and Commit to Database
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    return db_job