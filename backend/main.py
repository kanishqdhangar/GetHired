# main.py
from fastapi import FastAPI
from backend.routers import recommend_router

# Create FastAPI app
app = FastAPI()
    # title="AI Job Recommender Agent",
    # description="An LLM-driven system that analyzes resumes and recommends matching jobs with reasoning, skill gaps, and course suggestions.",
    # version="1.0.0"
# )

# Register routes
app.include_router(recommend_router.router)
# , prefix="/api", tags=["Job Recommender"])

# Root endpoint (for quick check)
@app.get("/")
def home():
    return {"message": "Welcome to the AI Job Recommender Agent 🚀"}

