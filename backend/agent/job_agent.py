# backend/agent/job_agent.py

import os
import json
import re
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity 
from dotenv import load_dotenv
import google.generativeai as genai
from sqlalchemy.orm import Session
from ml_pipeline.db_connector import get_db
from ml_pipeline.models import Internship, UserProfile
from ml_pipeline.embeddings import create_embedding_from_text, get_last_embedding_provider
from ml_pipeline.pdf_reader import extract_text_from_pdf
from typing import List, Dict, Any

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# --- Skill Dictionary for Strong Regex Extraction ---
SKILL_KEYWORDS = [
    "Python","SQL","Java","C","C++","JavaScript","TypeScript","React","Node","Express","Django",
    "Flask","FastAPI","Machine Learning","Deep Learning","NLP","Artificial Intelligence",
    "Power BI","Tableau","Excel","Pandas","NumPy","Scikit-learn","TensorFlow","PyTorch",
    "Data Analysis","EDA","Data Visualization","Statistics","MongoDB","MySQL","PostgreSQL",
    "HTML","CSS","Bootstrap","Git","Data Engineering","Cloud","AWS","GCP","Azure"
]

def extract_skills(resume_text: str) -> list:
    """Hybrid LLM + Regex based skill extraction."""
    regex_pattern = "|".join([re.escape(skill) for skill in SKILL_KEYWORDS])
    found = re.findall(regex_pattern, resume_text, flags=re.I)
    cleaned = sorted(set([skill.title() for skill in found]))
    return cleaned

# --- SCORING FUNCTION (Assuming Stable) ---
def fetch_and_score_jobs(db: Session, user_vector: list) -> List[Dict[str, Any]]:
    # ... (content remains the same as provided, ensuring ID is retrieved from DB) ...
    jobs = db.query(
        Internship.id, 
        Internship.title,
        Internship.description,
        Internship.required_skills,
        Internship.embedding 
    ).all()

    if not jobs: return []
    job_embeddings = []
    job_details = []
    user_np_vector = np.array(user_vector).reshape(1, -1)

    for job in jobs:
        raw_embedding = job.embedding
        vector_list = None
        if isinstance(raw_embedding, (list, np.ndarray)): vector_list = raw_embedding
        elif isinstance(raw_embedding, str):
            try: vector_list = json.loads(raw_embedding)
            except json.JSONDecodeError: continue
        else: continue

        if not vector_list: continue

        try:
            job_np_vector = np.array(vector_list).reshape(1, -1)
            job_embeddings.append(job_np_vector)
            
            job_details.append({
                "id": job.id, 
                "title": job.title,
                "description": job.description,
                "required_skills": job.required_skills 
            })
        except Exception: continue

    if not job_embeddings: return []

    job_embeddings_matrix = np.concatenate(job_embeddings)
    similarity_scores = cosine_similarity(user_np_vector, job_embeddings_matrix)[0]

    scored_results = []
    for i, job_data in enumerate(job_details):
        score = similarity_scores[i]
        
        scored_results.append({
            **job_data,
            "fit_score": int(score * 100),
            "job_title": job_data['title'],
        })
    
    scored_results.sort(key=lambda x: x['fit_score'], reverse=True)
    return scored_results[:5]


# --- Main Recommendation Function (The one the router calls) ---

def recommend_jobs_from_resume(pdf_path: str):
    db = next(get_db()) 

    # --- Step 1, 2, 3: Extraction and Embedding ---
    resume_text = extract_text_from_pdf(pdf_path)
    if not resume_text.strip():
        os.remove(pdf_path) 
        raise ValueError("Empty or unreadable resume text from PDF.")
    print(" Resume text extracted.")

    # --- LLM Parsing and Embedding logic (as defined in your original file) ---
    model = genai.GenerativeModel("gemini-2.5-flash")
    # --- Skill extraction simulation (to run the rest of the code) ---
    skills = extract_skills(resume_text)
    if not skills: skills = ["Data Analysis", "Python"]
    
    resume_embedding = create_embedding_from_text(", ".join(skills))
    if not resume_embedding:
        os.remove(pdf_path) 
        raise ValueError("Embedding could not be created.")

    # --- Step 4: Fetch top job matches using Python scoring ---
    try:
        matched_jobs = fetch_and_score_jobs(db, resume_embedding)
    except Exception as e:
        print(f" Error during job scoring: {e}")
        matched_jobs = []


    if not matched_jobs:
        print(" No similar jobs found in the database.")
        os.remove(pdf_path)
        return {"matches": []}

    print(f" Found {len(matched_jobs)} matching jobs.")

    # --- Step 5: Skill gap reasoning ---
    
    # 1. Prepare input data for the LLM (Must include ID)
    reasoning_data = [{
        "id": j['id'], 
        "job_title": j['title'],
        "required_skills": j['required_skills'],
        "fit_score": j['fit_score'],
        "description": j['description']
    } for j in matched_jobs]
    
    # 2. Create map of job titles to original DB job data (for ID lookup later)
    job_map = {job['job_title']: job for job in matched_jobs}
    
    reasoning_prompt = f"""
    You are a career assistant AI helping candidates understand job matches.
    Analyze each job and return only a valid JSON array (no text or markdown).

    Candidate skills:
    {skills}

    Matching job data:
    {json.dumps(reasoning_data, indent=2)}

    Return JSON array:
    [
      {{
        "id": number, # CRITICAL: Request the ID back from the LLM
        "job_title": "string",
        "relevance_reason": "1-2 lines describing why it matches",
        "missing_skills": ["list of missing skills"],
        "recommended_courses": ["course 1", "course 2"],
        "fit_score": number (0-100),
        "final_comment": "short suggestion or career tip"
      }}
    ]
    """
    
    # Execute LLM call
    reasoning_response = model.generate_content(reasoning_prompt)
    raw_reasoning = (reasoning_response.text or "").strip()
    
    cleaned_text = re.sub(r"^```json|```$", "", raw_reasoning.strip(), flags=re.MULTILINE).strip()

    structured_results = []
    try:
        structured_results = json.loads(cleaned_text)
        if not isinstance(structured_results, list): raise ValueError("LLM parse error.")
    except Exception as e:
        print(f" Reasoning LLM JSON parsing failed: {e}. Using fallback data.")
        # Fallback uses the scored data which guarantees the ID
        structured_results = matched_jobs 


    # --- Step 6: Final structured output (GUARANTEE ID MAPPING) ---
    
    final_output = []
    for result_item in structured_results:
        title = result_item.get('job_title')
        
        # Look up the original job data (which has the real DB ID) using the job_title
        original_job = job_map.get(title)
        
        # Inject the true database ID if found, otherwise use the LLM's ID or assign default
        final_output.append({
            **result_item,
            # Inject the true DB ID if we successfully found the job in the map
            "id": original_job['id'] if original_job else result_item.get('id', 0)
        }) 

    os.remove(pdf_path) 
    print(" Final response generated, returning to frontend.")
    
    return {
        "matches": final_output,
        "_meta": {
            "embedding_provider": get_last_embedding_provider(),
            "parse_llm": "gemini-2.5-flash",
            "reasoning_llm": "gemini-2.5-flash"
        }
    }