import os
from dotenv import load_dotenv


load_dotenv()

def fetch_top_k_jobs(resume_embedding, top_k=5):
    """
    Fetch top-K similar jobs from the 'internships' table using pgvector similarity.
    Assumes table columns: id, title, required_skills, description, embedding.
    Returns a list of dicts.
    """

    if not resume_embedding or not isinstance(resume_embedding, (list, tuple)):
        raise ValueError("Invalid or empty embedding passed to fetch_top_k_jobs()")

    embedding_str = "[" + ", ".join(map(str, resume_embedding)) + "]"

    query = """
        SELECT 
            id,
            title,
            required_skills,
            description,
            
            embedding <-> CAST(%s AS vector) AS distance
        FROM internships
        ORDER BY embedding <-> CAST(%s AS vector)
        LIMIT %s;
    """

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("⚠️ DATABASE_URL not found in environment.")
        return []

    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor

        with psycopg2.connect(database_url, cursor_factory=RealDictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute(query, (embedding_str, embedding_str, top_k))
                rows = cur.fetchall()
                print(f"✅ Retrieved {len(rows)} job(s) from DB.")
                return rows

    except Exception as e:
        print("⚠️ Error in fetch_top_k_jobs:", e)
        return []
