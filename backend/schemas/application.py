from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Schema for Application Submission (Input) ---
class ApplicationCreate(BaseModel):
    """Schema for a student submitting an application."""
    job_id: int = Field(..., description="The ID of the job the student is applying for.")

# --- Schema for Application Viewing (Output) ---
class ApplicationRead(BaseModel):
    """Schema for viewing a submitted application."""
    id: int
    student_id: int
    job_id: int
    status: str = Field(..., description="Current status of the application (e.g., Applied, Reviewed, Interview).")
    applied_date: datetime
    job_title: str | None = None   
    job_description: str | None = None
    skills_required: List[str] = Field(default=[], example=["Python", "TensorFlow", "SQL", "Git"])
    resume_path: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- Schema for Recruiter View (Future) ---
class ApplicantRead(ApplicationRead):
    """
    Schema for recruiters to view a list of applicants for a job.
    Inherits application details and can be extended with student profile data.
    """
    student_email: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    """Schema for Recruiter to update the application status."""
    status: str = Field(..., description="New status: Applied, Interview, Accepted, Rejected")