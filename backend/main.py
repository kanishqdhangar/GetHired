from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware 
# Import files based on your confirmed structure
from backend.ml_pipeline.db_connector import engine
from backend.ml_pipeline.models import Base, init_db 
from backend.routers.recommend_router import router as recommend_router
from backend.routers.auth_router import auth_router
from backend.routers.recruiter_router import recruiter_router # Updated
from backend.routers.student_router import student_router # <-- NEW IMPORT

# --- 1. Lifespan Events (Database Initialization) ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Runs database table creation.
    """
    print("Initializing database and creating tables...")
    init_db()
    
    yield
    
    print("Application shutdown.")

# --- 2. FastAPI Application Initialization ---

app = FastAPI(
    title="GetHired Internship Recommendation API",
    description="Backend service for personalized job and course recommendations.",
    version="1.0.0",
    lifespan=lifespan 
)

# --- 3. CORS MIDDLEWARE SETUP (CRITICAL FIX) ---
origins = [
    "http://localhost",
    "http://localhost:3000", # Allow the Next.js development server
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- 4. Register Routers ---

# Core Recommendation Router
app.include_router(recommend_router)

# Authentication Router
app.include_router(auth_router)

# Recruiter-specific Router (Includes Ingestion, View, Edit, Delete)
app.include_router(recruiter_router)

# Student-specific Router (Applications) <-- NEW REGISTRATION
app.include_router(student_router)

# NOTE: The redundant admin_router has been removed.