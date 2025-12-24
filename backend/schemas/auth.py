from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- Schemas for Input Validation (User Registration) ---

class UserCreate(BaseModel):
    """Schema for creating a new user (input)."""
    email: EmailStr
    password: str
    role: str 

# --- Schemas for Output (Reading User Data) ---

class UserRead(BaseModel):
    """Schema for reading user data (output)."""
    id: int
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

# --- Schema for Authentication Token Output ---

class Token(BaseModel):
    """Schema for the JWT token response upon successful login."""
    access_token: str
    token_type: str
    user_role: str 
    user_name: str 

class TokenData(BaseModel):
    """Internal schema for decoding JWT payload."""
    user_id: Optional[str] = None
    role: Optional[str] = None