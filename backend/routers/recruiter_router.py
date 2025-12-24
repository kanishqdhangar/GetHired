from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os
from fastapi.responses import Response
from ml_pipeline.db_connector import get_db
from security.auth import get_current_recruiter
from ml_pipeline.models import User
from schemas.job import JobCreate, JobRead, RecommendationRead
from crud.recruiter import get_jobs_by_recruiter, update_job, delete_job, update_application_status, get_applicants_for_job
from crud.job import create_job_with_embedding 
from fastapi.responses import FileResponse 
from crud.recruiter import get_application_by_id_and_recruiter 
from schemas.application import ApplicationRead, ApplicantRead, ApplicationStatusUpdate 

recruiter_router = APIRouter(prefix="/recruiter", tags=["Recruiter Operations"])

# --- Secure Resume Download ---
@recruiter_router.get("/resume/{app_id}")
def download_applicant_resume(
    app_id: int,
    db: Session = Depends(get_db),
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Securely serves the resume PDF file associated with an application ID.
    Only allows access if the recruiter owns the job.
    """
    recruiter_id = current_recruiter.id
    
    # Check ownership and retrieve application record
    app = get_application_by_id_and_recruiter(db, app_id=app_id, recruiter_id=recruiter_id)

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or job not owned by this recruiter."
        )

    file_path = app.resume_path

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on server."
        )

    # Return the file securely
    return FileResponse(file_path, media_type='application/pdf', filename=os.path.basename(file_path))

# --- POST: Job Ingestion  ---
@recruiter_router.post(
    "/jobs/ingest", 
    response_model=JobRead, 
    status_code=status.HTTP_201_CREATED
)
def ingest_job(
    job: JobCreate, 
    db: Session = Depends(get_db),
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Ingests a new job posting, calculates its embedding, and links it to the Recruiter.
    (This replaces the old /admin/jobs/ingest path)
    """
    recruiter_id = current_recruiter.id
    
    
    db_job = create_job_with_embedding(db=db, job=job, recruiter_id=recruiter_id)
    
    return db_job

# --- GET: View Posted Jobs (Filtering) ---
@recruiter_router.get(
    "/jobs", 
    response_model=List[JobRead], 
    status_code=status.HTTP_200_OK
)
def read_posted_jobs(
    db: Session = Depends(get_db), 
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Retrieves all jobs posted by the currently authenticated Recruiter (filtering is done in CRUD).
    """
    jobs = get_jobs_by_recruiter(db, recruiter_id=current_recruiter.id)
    return jobs

# --- PUT: Edit Existing Job ---
@recruiter_router.put("/jobs/{job_id}", response_model=JobRead)
def edit_job(
    job_id: int,
    job_update: JobCreate,
    db: Session = Depends(get_db),
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Updates an existing job post, requires Recruiter ownership.
    """
    updated_job = update_job(
        db=db, 
        job_id=job_id, 
        job_update=job_update, 
        recruiter_id=current_recruiter.id
    )
    if not updated_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Job not found or unauthorized access."
        )
    return updated_job

# --- DELETE: Delete Job ---
@recruiter_router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Deletes a job post, requires Recruiter ownership.
    """
    success = delete_job(db=db, job_id=job_id, recruiter_id=current_recruiter.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Job not found or unauthorized access."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- PUT: Update Application Status ---
@recruiter_router.put(
    "/applications/{app_id}/status",
    response_model=ApplicationRead,
    status_code=status.HTTP_200_OK
)
def update_applicant_status(
    app_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Allows the recruiter to update the status of an application they own.
    """
    recruiter_id = current_recruiter.id
    new_status = status_update.status

    try:
        updated_app = update_application_status(
            db, 
            app_id=app_id, 
            recruiter_id=recruiter_id, 
            new_status=new_status
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


    if updated_app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or job not owned by this recruiter."
        )

    return updated_app

@recruiter_router.get(
    "/jobs/{job_id}/applicants",
    response_model=List[ApplicantRead], 
    status_code=status.HTTP_200_OK
)
def read_job_applicants(
    job_id: int,
    db: Session = Depends(get_db),
    current_recruiter: User = Depends(get_current_recruiter)
):
    """
    Retrieves a list of applicants for a job ID, ensuring Recruiter ownership.
    """
    recruiter_id = current_recruiter.id

    applications = get_applicants_for_job(db, job_id=job_id, recruiter_id=recruiter_id)

    if applications is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not owned by this recruiter."
        )

    
    applicant_data = []
    for app in applications:
        applicant_data.append(ApplicantRead(
            id=app.id,
            job_id=app.job_id,
            student_id=app.student_id,
            status=app.status,
            applied_date=app.applied_date,
            student_email=app.student.email 
        ))

    return applicant_data