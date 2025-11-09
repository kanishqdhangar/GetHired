# backend/ml_pipeline/embeddings.py
import os
import numpy as np
from openai import OpenAI
import google.generativeai as genai
from sentence_transformers import SentenceTransformer

# ✅ Handle optional Z.AI import gracefully
try:
    import zai
except ImportError:
    zai = None

# --- Load API keys ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
ZAI_API_KEY = os.getenv("ZAI_API_KEY")

# --- Initialize clients ---
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

zai_client = zai.Client(api_key=ZAI_API_KEY) if (ZAI_API_KEY and zai) else None

# --- Local model (offline fallback) ---
local_model = SentenceTransformer("all-MiniLM-L6-v2")

LAST_EMBEDDING_PROVIDER = None


def create_embedding_from_text(text: str) -> list:
    """
    Create embeddings from text using provider priority:
    OpenAI → Gemini → Z.AI → Local MiniLM.
    Returns list[float].
    """
    global LAST_EMBEDDING_PROVIDER

    if not text or not text.strip():
        return []

    text = text.strip()

    # --- 1️⃣ Try OpenAI ---
    if openai_client:
        try:
            response = openai_client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            embedding = response.data[0].embedding
            LAST_EMBEDDING_PROVIDER = "openai"
            print("✅ Using OpenAI embedding.")
            return embedding
        except Exception as e:
            print(f"⚠️ OpenAI embedding failed: {e}")

    # --- 2️⃣ Try Gemini ---
    if GOOGLE_API_KEY:
        try:
            response = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            embedding = response["embedding"]
            LAST_EMBEDDING_PROVIDER = "gemini"
            print("✅ Using Gemini embedding.")
            return embedding
        except Exception as e:
            print(f"⚠️ Gemini embedding failed: {e}")

    # --- 3️⃣ Try Z.AI ---
    if zai_client:
        try:
            response = zai_client.embeddings.create(model="embedding-2", input=text)
            embedding = (
                response.data[0].embedding
                if hasattr(response, "data") and response.data
                else []
            )
            if embedding:
                print("✅ Using Z.AI embedding.")
                LAST_EMBEDDING_PROVIDER = "zai"
                return embedding
        except Exception as e:
            print(f"⚠️ Z.AI embedding failed: {e}")

    # --- 4️⃣ Local fallback ---
    try:
        embedding = local_model.encode(text).tolist()
        LAST_EMBEDDING_PROVIDER = "local"
        print("✅ Using local embedding (MiniLM).")
        return embedding
    except Exception as e:
        print(f"⚠️ Local embedding failed: {e}")

    # --- 5️⃣ Emergency fallback ---
    print("⚠️ All embedding providers failed. Returning zero vector.")
    LAST_EMBEDDING_PROVIDER = "fallback"
    return np.zeros(384).tolist()


def create_embedding_from_skills(skills: list) -> list:
    """Combine skills list into a single text and embed."""
    combined_text = ", ".join(skills)
    return create_embedding_from_text(combined_text)


def get_last_embedding_provider() -> str:
    """Return the name of the last embedding provider used."""
    return LAST_EMBEDDING_PROVIDER or "unknown"
