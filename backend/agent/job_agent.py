# backend/agent/job_agent.py
import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai
from backend.ml_pipeline.db_utils import fetch_top_k_jobs
from backend.ml_pipeline.embeddings import create_embedding_from_text, get_last_embedding_provider
from backend.ml_pipeline.pdf_reader import extract_text_from_pdf

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def recommend_jobs_from_resume(pdf_path: str):
    # --- Step 1: Extract resume text ---
    resume_text = extract_text_from_pdf(pdf_path)
    if not resume_text.strip():
        raise ValueError("Empty or unreadable resume text from PDF.")
    print(" Resume text extracted.")

    # --- Step 2: Parse resume into JSON (skills) ---
    parse_prompt = f"""
    You are an expert resume parser. Extract the following details in valid JSON format:
    {{
        "skills": [list of technical and soft skills only]
    }}
    Resume Text:
    {resume_text}
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    parse_response = model.generate_content(parse_prompt)
    raw_text = (parse_response.text or "").strip()

    skills = []
    try:
        parsed = json.loads(raw_text)
        if isinstance(parsed, dict) and "skills" in parsed:
            skills = parsed["skills"]
        elif isinstance(parsed, list):
            skills = parsed
    except json.JSONDecodeError:
        # --- fallback using regex skill extraction ---
        skills = re.findall(
            r"\b(Python|SQL|Java|Excel|Machine Learning|Power BI|Tableau|C\+\+|Data Analysis|HTML|CSS|AI|EDA|Statistics)\b",
            resume_text,
            flags=re.I,
        )
        skills = list(set(map(str.title, skills)))

    if not skills:
        skills = ["Data Analysis", "Python"]

    print(f" Extracted skills: {skills}")

    # --- Step 3: Create embeddings ---
    skills_text = ", ".join(skills)
    resume_embedding = create_embedding_from_text(skills_text)
    if not resume_embedding:
        raise ValueError("Embedding could not be created from skills text.")
    print(" Resume embedding created.")

    # --- Step 4: Fetch top job matches ---
    matched_jobs = fetch_top_k_jobs(resume_embedding, top_k=5)
    if not matched_jobs:
        print(" No similar jobs found in the database.")
    else:
        print(f" Found {len(matched_jobs)} matching jobs.")

    # --- Step 5: Skill gap reasoning ---
    reasoning_prompt = f"""
    You are a career assistant AI helping candidates understand job matches.
    Analyze each job and return only a valid JSON array (no text or markdown).

    Candidate skills:
    {skills}

    Matching job data:
    {json.dumps(matched_jobs, indent=2)}

    Return JSON array:
    [
      {{
        "job_title": "string",
        "relevance_reason": "1-2 lines describing why it matches",
        "missing_skills": ["list of missing skills"],
        "recommended_courses": ["course 1", "course 2"],
        "fit_score": number (0-100),
        "final_comment": "short suggestion or career tip"
      }}
    ]
    """

    reasoning_response = model.generate_content(reasoning_prompt)
    raw_reasoning = (reasoning_response.text or "").strip()

    # --- Clean JSON if Gemini adds markdown or code fences ---
    cleaned_text = re.sub(r"^```json|```$", "", raw_reasoning.strip(), flags=re.MULTILINE).strip()

    try:
        structured_results = json.loads(cleaned_text)
        if not isinstance(structured_results, list):
            raise ValueError("Gemini did not return a JSON array.")
    except Exception as e:
        print(f" Reasoning LLM JSON parsing failed: {e}")
        structured_results = [
            {"job_title": j.get("title", "Unknown"), "fit_score": 0}
            for j in matched_jobs
        ]

    print(" Skill gap reasoning complete.")

    # --- Step 6: Final structured output ---
    return {
        "matches": structured_results,
        "_meta": {
            "embedding_provider": get_last_embedding_provider(),
            "parse_llm": "gemini-2.5-flash",
            "reasoning_llm": "gemini-2.5-flash"
        }
    }
