from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- 1. Schemas for Input Validation (User Registration) ---

class UserCreate(BaseModel):
    """Schema for creating a new user (input)."""
    email: EmailStr
    password: str
    # Role must be specified during registration
    role: str # Must be 'student' or 'recruiter'

# --- 2. Schemas for Output (Reading User Data) ---

class UserRead(BaseModel):
    """Schema for reading user data (output)."""
    id: int
    email: EmailStr
    role: str

    # Configuration class tells Pydantic to read from SQLAlchemy ORM objects
    class Config:
        from_attributes = True

# --- 3. Schema for Authentication Token Output ---

class Token(BaseModel):
    """Schema for the JWT token response upon successful login."""
    access_token: str
    token_type: str
    user_role: str # Include the role for easy frontend routing
    user_name: str 

class TokenData(BaseModel):
    """Internal schema for decoding JWT payload."""
    user_id: Optional[str] = None
    role: Optional[str] = None