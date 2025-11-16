# routers/recommend_router.py
from fastapi import APIRouter, UploadFile, File, Response
import os
from agent.job_agent import recommend_jobs_from_resume

router = APIRouter()

@router.post("/recommend")
async def recommend_jobs(file: UploadFile = File(...), response: Response = None):
    os.makedirs("temp", exist_ok=True)
    pdf_path = f"temp/{file.filename}"
    with open(pdf_path, "wb") as f:
        f.write(await file.read())
    
    result = recommend_jobs_from_resume(pdf_path)
    # Move meta info to headers and strip from body
    meta = result.pop("_meta", None)
    if response is not None and isinstance(meta, dict):
        if meta.get("embedding_provider") is not None:
            response.headers["X-Embedding-Provider"] = str(meta.get("embedding_provider"))
        if meta.get("parse_llm") is not None:
            response.headers["X-Parse-LLM"] = str(meta.get("parse_llm"))
        if meta.get("reasoning_llm") is not None:
            response.headers["X-Reasoning-LLM"] = str(meta.get("reasoning_llm"))
    return result
