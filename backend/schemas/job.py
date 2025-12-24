from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Base Schema for Job Data (Used for Input and Base for Output) ---
class JobBase(BaseModel):
    """Base schema for data common across creation and reading."""
    title: str = Field(..., example="Senior Data Scientist Intern")
    description: str = Field(..., example="Develop and deploy ML models for recommendation engine.")
    required_skills: List[str] = Field(default=[], example=["Python", "TensorFlow", "SQL", "Git"])

# --- Schema for Job Creation (Input) ---
class JobCreate(JobBase):
    """Schema for creating a new job (input)."""
    # Inherits title, description, and required_skills from JobBase
    pass

# --- Schema for Job Reading (Output) ---
class JobRead(JobBase):
    """
    Schema for reading job data (output). 
    Used as the response model for GET requests (/recruiter/jobs).
    """
    id: int
    recruiter_id: int
    date_posted: datetime
    
    class Config:
        from_attributes = True 

# --- Schema for Recommendation Output ---
class RecommendationRead(JobRead):
    """
    Schema for displaying a job recommendation, inheriting JobRead 
    and adding the ML-derived score.
    """
    match_score: float = Field(..., example=0.85, description="Cosine similarity score.")