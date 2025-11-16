import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

# Import the get_db dependency and User model
from ..ml_pipeline.db_connector import get_db
from ..ml_pipeline.models import User

# --- 1. JWT and Security Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-please-change")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# --- 2. Password Hashing Utilities ---

def _get_pwd_context():
    """Create CryptContext with bcrypt safely (no unsupported args)."""
    return CryptContext(schemes=["bcrypt"], deprecated="auto")

def _truncate_password(password: str) -> str:
    """
    Safely truncate the password to 72 bytes (bcrypt limit).
    Returns a truncated string, not bytes.
    """
    encoded = password.encode("utf-8")[:72]
    return encoded.decode("utf-8", errors="ignore")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password safely."""
    pwd_context = _get_pwd_context()

    if isinstance(plain_password, bytes):
        plain_password = plain_password.decode("utf-8", "ignore")

    safe_password = _truncate_password(plain_password)
    return pwd_context.verify(safe_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password safely with bcrypt."""
    pwd_context = _get_pwd_context()

    if isinstance(password, bytes):
        password = password.decode("utf-8", "ignore")

    safe_password = _truncate_password(password)
    return pwd_context.hash(safe_password)

# --- 3. JWT Token Utilities ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT token and return payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        user_role: str = payload.get("role")

        if user_id is None or user_role is None:
            return None

        return {"user_id": user_id, "role": user_role}
    except JWTError:
        return None

# --- 4. FastAPI Dependencies (Authentication and Authorization) ---

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    token_data = decode_access_token(token)

    if token_data is None:
        raise CREDENTIALS_EXCEPTION

    user = db.query(User).filter(User.id == token_data["user_id"]).first()

    if user is None:
        raise CREDENTIALS_EXCEPTION

    return user

def get_current_recruiter(current_user: User = Depends(get_current_user)):
    if current_user.role != 'recruiter':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Recruiter access required."
        )
    return current_user

def get_current_student(current_user: User = Depends(get_current_user)):
    if current_user.role != 'student':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Student access required."
        )
    return current_user

def get_student_from_query_token(
    token: str = Query(..., alias="token"), # Extracts token from ?token=...
    db: Session = Depends(get_db),
):
    """
    Validates the JWT token provided in the URL query string 
    and checks if the user is a student.
    """
    token_data = decode_access_token(token)
    
    if token_data is None:
        raise CREDENTIALS_EXCEPTION

    # Retrieve user from DB
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    
    # Check if user exists and is a student (Authorization)
    if user is None or user.role != 'student':
        # Raises 403 if user exists but is not the correct role
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required.")
        
    return user