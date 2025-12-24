from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List
import os
from fastapi.responses import FileResponse
from ml_pipeline.db_connector import get_db
from security.auth import get_current_student, get_student_from_query_token
from ml_pipeline.models import User, Application
from schemas.application import ApplicationCreate, ApplicationRead
from crud.student import apply_for_job, get_applications_by_student, _update_application_resume_path 

student_router = APIRouter(prefix="/student", tags=["Student Operations"])

# --- POST: Submit Application ---
@student_router.post("/apply/{job_id}", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def submit_application_with_resume(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_student: User = Depends(get_current_student)
):
    """
    Submits a new job application and saves the uploaded resume file.
    """
    student_id = current_student.id

    
    try:
        new_app = apply_for_job(db, student_id=student_id, job_id=job_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    
    if new_app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    RESUME_DIR = f"resumes/{student_id}"
    os.makedirs(RESUME_DIR, exist_ok=True)
    
    filename = f"{job_id}_{new_app.id}_{file.filename}"
    file_path = os.path.join(RESUME_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail=f"File save error: {str(e)}")

    final_app = _update_application_resume_path(db, new_app.id, file_path)

    return final_app
# --- GET: View All Applications ---
@student_router.get("/applications", response_model=List[ApplicationRead])
def view_my_applications(
    db: Session = Depends(get_db),
    current_student: User = Depends(get_current_student)
):
    """
    Retrieves all applications submitted by the authenticated student.
    """
    applications = get_applications_by_student(db, student_id=current_student.id)
    return applications

@student_router.get("/my-resume")
def download_student_resume(
    job_id: int = Query(..., alias="job_id"),
    db: Session = Depends(get_db),
    current_student: User = Depends(get_student_from_query_token)
):
    """
    Serves the resume associated with a specific application (job_id), 
    authenticated by the student's token.
    """
    student_id = current_student.id
    
    
    application_record = db.query(Application).filter(
        Application.student_id == student_id,
        Application.job_id == job_id
    ).first()

    if not application_record or not application_record.resume_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found for this application."
        )

    file_path = application_record.resume_path

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on server storage."
        )

    return FileResponse(file_path, media_type='application/pdf')