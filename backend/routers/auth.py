"""
NeuroLearn AI — Auth Router
Handles user registration, login (JWT), and profile retrieval.
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from models.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from models.db import get_user_by_email, create_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ─── Security setup ──────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "neurolearn-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ─── Helpers ─────────────────────────────────────────────────────────────────
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"], name=user["name"], email=user["email"],
        exam=user["exam"], xp=user["xp"], streak=user["streak"],
        level=user["level"], created_at=user["created_at"]
    )

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        user = get_user_by_email(email)
        return user
    except JWTError:
        return None


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    """Register a new user account."""
    if get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(body.password)
    user = create_user(name=body.name, email=body.email, hashed_password=hashed, exam=body.exam)
    token = create_access_token({"sub": user["email"]})
    return TokenResponse(access_token=token, user=user_to_response(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Authenticate user and return JWT token."""
    user = get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user["email"]})
    return TokenResponse(access_token=token, user=user_to_response(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the current logged-in user's profile."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_to_response(current_user)
