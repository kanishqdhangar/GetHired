from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List
import os
from fastapi.responses import FileResponse # Used for resume serving (Recruiter side)
# Import utilities from confirmed paths
from ..ml_pipeline.db_connector import get_db
from ..security.auth import get_current_student, get_student_from_query_token
from ..ml_pipeline.models import User, Application
from ..schemas.application import ApplicationCreate, ApplicationRead
from ..crud.student import apply_for_job, get_applications_by_student, _update_application_resume_path 

student_router = APIRouter(prefix="/student", tags=["Student Operations"])

# --- 1. POST: Submit Application ---
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

    # 1. Create the Application record first (without path)
    try:
        new_app = apply_for_job(db, student_id=student_id, job_id=job_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    
    if new_app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    # 2. Save the Resume file locally
    # Define the directory: /resumes/{user_id}/
    RESUME_DIR = f"resumes/{student_id}"
    os.makedirs(RESUME_DIR, exist_ok=True)
    
    # Define filename: {job_id}_{application_id}_{original_name}
    filename = f"{job_id}_{new_app.id}_{file.filename}"
    file_path = os.path.join(RESUME_DIR, filename)

    try:
        # Asynchronously write the file content
        with open(file_path, "wb") as buffer:
            # Note: await is necessary for file.read()
            buffer.write(await file.read())
    except Exception as e:
        # If file save fails, delete the application record for cleanup
        # (Simplified error handling, proper cleanup requires complex logic)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail=f"File save error: {str(e)}")

    # 3. Update the Application record with the final path
    final_app = _update_application_resume_path(db, new_app.id, file_path)

    return final_app
# --- 2. GET: View All Applications ---
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
    job_id: int = Query(..., alias="job_id"), # <-- CRITICAL: Get Job ID from URL query
    db: Session = Depends(get_db),
    current_student: User = Depends(get_student_from_query_token)
):
    """
    Serves the resume associated with a specific application (job_id), 
    authenticated by the student's token.
    """
    student_id = current_student.id
    
    # CRITICAL FIX: Query the Application table using both student_id and job_id
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

    # Return the file for viewing (not downloading)
    return FileResponse(file_path, media_type='application/pdf')