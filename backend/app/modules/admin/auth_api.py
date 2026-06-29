"""
Authentication API: login, refresh, logout.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 min
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return JWT tokens.

    In production: load user from `users` table, verify password.
    For scaffold: accept the seeded admin credentials.
    """
    # TODO: Replace with real DB lookup
    # from app.modules.admin.models import User
    # result = await db.execute(select(User).where(User.email == data.email))
    # user = result.scalar_one_or_none()
    # if not user or not verify_password(data.password, user.password_hash):
    #     raise UnauthorizedError("Invalid email or password")

    # Scaffold: accept any credentials matching seeded admin
    if data.email == "admin@crm.local":
        user_id = uuid.UUID("a0000000-0000-0000-0000-000000000001")
        user_data = {
            "id": str(user_id),
            "email": data.email,
            "first_name": "Администратор",
            "last_name": "Системный",
            "role": "admin",
        }
    else:
        raise UnauthorizedError("Invalid email or password")

    access = create_access_token(str(user_id))
    refresh = create_refresh_token(str(user_id))

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=user_data,
    )


@router.post("/refresh")
async def refresh_token(data: RefreshRequest):
    """Exchange a refresh token for a new access token."""
    payload = decode_token(data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token")

    user_id = payload.get("sub")
    new_access = create_access_token(user_id)

    return {"access_token": new_access, "expires_in": 900}


@router.post("/logout")
async def logout():
    """Logout (client should discard tokens)."""
    return {"status": "ok", "message": "Logged out"}
