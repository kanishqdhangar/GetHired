from sqlalchemy.orm import Session
from backend.ml_pipeline.models import Internship, Application 
from backend.ml_pipeline.models import UserProfile
from backend.schemas.application import ApplicationCreate, ApplicationRead
from typing import List, Dict, Any

# --- User Profile Management (for student resume upload) ---

def create_or_update_profile(db: Session, user_id: int, embedding: list, full_name: str):
    """Creates or updates a student's profile and their resume embedding."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if profile:
        profile.embedding = embedding
        profile.full_name = full_name
    else:
        profile = UserProfile(
            user_id=user_id,
            embedding=embedding,
            full_name=full_name
        )
        db.add(profile)
        
    db.commit()
    db.refresh(profile)
    return profile

# --- Application Management ---

def _update_application_resume_path(db: Session, app_id: int, resume_path: str):
    """Saves the local storage path of the resume to the application record."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if app:
        app.resume_path = resume_path
        db.commit()
        db.refresh(app)
        return app
    return None


# --- UPDATED: apply_for_job function to return the initial application ID ---
def apply_for_job(db: Session, student_id: int, job_id: int) -> Application:
    """
    Creates a new application record for a student.
    (Resume path must be added by the router after file save)
    """
    
    # Check if job exists
    if not db.query(Internship).filter(Internship.id == job_id).first():
        return None 

    # Check for duplicate application
    if db.query(Application).filter(Application.student_id == student_id, Application.job_id == job_id).first():
        raise ValueError("Duplicate application.")

    # CRITICAL: Initialize resume_path as None/empty string
    new_app = Application(
        student_id=student_id,
        job_id=job_id,
        status="Applied",
        resume_path="" 
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app # Return the application object (which now has an ID)

def get_applications_by_student(db: Session, student_id: int):
    results = (
        db.query(
            Application,
            Internship.title.label("job_title"),
            Internship.description.label("job_description"),
            Internship.required_skills.label("skills_required")
        )
        .join(Internship, Internship.id == Application.job_id)
        .filter(Application.student_id == student_id)
        .all()
    )

    output = []

    for app, job_title, job_description, skills_required in results:
        output.append({
            "id": app.id,
            "student_id": app.student_id,
            "job_id": app.job_id,
            "status": app.status,
            "applied_date": app.applied_date.isoformat(),
            "resume_path": app.resume_path,
            "job_title": job_title,
            "job_description" : job_description,
            "skills_required": skills_required,
        })

    return output