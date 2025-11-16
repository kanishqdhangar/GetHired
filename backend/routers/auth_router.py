from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
from typing import Annotated

# --- CONFIRMED CORRECT IMPORTS BASED ON YOUR STRUCTURE ---
from ..ml_pipeline.db_connector import get_db
from ..ml_pipeline.models import User
# The following imports are relative to the 'backend' package and should be correct
from ..schemas.auth import UserCreate, Token, UserRead
from ..security.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- 1. User Registration ---

@auth_router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (Student or Recruiter).
    """
    # Check if the user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered."
        )

    # Validate role input
    if user_in.role not in ['student', 'recruiter']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'student' or 'recruiter'."
        )

    # Hash the password for secure storage
    hashed_password = get_password_hash(user_in.password)

    # Create the new user object
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database integrity error during registration."
        )
    
    return new_user

# --- 2. Login and Token Generation ---

# Annotated type is used for Pydantic/FastAPI request forms
# OAuth2PasswordRequestForm expects 'username' (we use email) and 'password'
@auth_router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return a JWT access token.
    'username' maps to 'email' in our implementation.
    """
    # 1. Find the user by email (username)
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Verify the password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create the JWT token
    access_token_expires = timedelta(minutes=30)
    
    # The token payload includes the user's ID ('sub') and role
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    # Return the token, which is used by the frontend for all future requests
    return {"access_token": access_token, "token_type": "bearer", "user_role": user.role, "user_name": user.email
            }

# --- 3. Profile Endpoint (Testing Authorization) ---

@auth_router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Test endpoint to verify token validity and return current user details.
    """
    return current_user