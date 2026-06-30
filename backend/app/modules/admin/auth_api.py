"""
Authentication & User Profile API.
Login, refresh, profile, user management.
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from loguru import logger

from app.core.exceptions import UnauthorizedError, ForbiddenError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── In-memory user store (replace with DB in production) ─────────
# Two roles: "admin" and "user"

class UserProfile:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

USERS_DB: dict[str, dict] = {
    "admin@crm.local": {
        "id": "a0000000-0000-0000-0000-000000000001",
        "email": "admin@crm.local",
        "password": "admin",  # any password accepted in dev
        "first_name": "Администратор",
        "last_name": "Системный",
        "role": "admin",
        "position": "Системный администратор",
        "department": "Руководство",
        "phone_personal": "+7 (495) 123-45-67",
        "phone_internal": "101",
        "avatar_url": None,
        "is_active": True,
    },
    "ivan.petrov@crm.local": {
        "id": "a0000000-0000-0000-0000-000000000002",
        "email": "ivan.petrov@crm.local",
        "password": "user",
        "first_name": "Иван",
        "last_name": "Петров",
        "role": "user",
        "position": "Менеджер продаж",
        "department": "Отдел продаж",
        "phone_personal": "+7 (916) 555-12-34",
        "phone_internal": "205",
        "avatar_url": None,
        "is_active": True,
    },
    "anna.smirnova@crm.local": {
        "id": "a0000000-0000-0000-0000-000000000003",
        "email": "anna.smirnova@crm.local",
        "password": "user",
        "first_name": "Анна",
        "last_name": "Смирнова",
        "role": "user",
        "position": "Менеджер продаж",
        "department": "Отдел продаж",
        "phone_personal": "+7 (921) 333-44-55",
        "phone_internal": "206",
        "avatar_url": None,
        "is_active": True,
    },
    "igor.sidorov@crm.local": {
        "id": "a0000000-0000-0000-0000-000000000004",
        "email": "igor.sidorov@crm.local",
        "password": "user",
        "first_name": "Игорь",
        "last_name": "Сидоров",
        "role": "user",
        "position": "Старший разработчик",
        "department": "Исполнение (Проекты)",
        "phone_personal": "+7 (903) 777-88-99",
        "phone_internal": "310",
        "avatar_url": None,
        "is_active": True,
    },
    "olga.kuznetsova@crm.local": {
        "id": "a0000000-0000-0000-0000-000000000005",
        "email": "olga.kuznetsova@crm.local",
        "password": "user",
        "first_name": "Ольга",
        "last_name": "Кузнецова",
        "role": "user",
        "position": "Бухгалтер",
        "department": "Финансовый отдел",
        "phone_personal": "+7 (495) 222-33-44",
        "phone_internal": "401",
        "avatar_url": None,
        "is_active": True,
    },
}


def _get_user_from_token(authorization: Optional[str]) -> dict:
    """Extract user dict from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing authorization header")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise UnauthorizedError("Invalid or expired token")
    user_id = payload.get("sub")
    # Find user by id
    for email, user in USERS_DB.items():
        if user["id"] == user_id:
            return user
    raise UnauthorizedError("User not found")


# ── Schemas ──────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    position: str
    department: str
    phone_personal: str
    phone_internal: str
    avatar_url: Optional[str] = None
    is_active: bool


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone_personal: Optional[str] = None
    phone_internal: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreateByAdmin(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)
    first_name: str
    last_name: str
    role: str = Field("user", pattern="^(admin|user)$")
    position: Optional[str] = None
    department: Optional[str] = None
    phone_personal: Optional[str] = None
    phone_internal: Optional[str] = None


class UserUpdateByAdmin(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(admin|user)$")
    position: Optional[str] = None
    department: Optional[str] = None
    phone_personal: Optional[str] = None
    phone_internal: Optional[str] = None
    is_active: Optional[bool] = None


# ── Auth endpoints ───────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Authenticate user and return JWT tokens."""
    user = USERS_DB.get(data.email)

    if not user or not user.get("is_active", True):
        raise UnauthorizedError("Неверный email или пароль")

    # Dev mode: accept any password for seeded users
    # In production: verify_password(data.password, user["password_hash"])

    user_id = user["id"]
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)

    user_data = {
        "id": user_id,
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"],
        "position": user.get("position", ""),
        "department": user.get("department", ""),
    }

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


# ── Profile endpoints (current user) ─────────────────────────────

from fastapi import Header

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(authorization: Optional[str] = Header(None)):
    """Get current user's full profile."""
    user = _get_user_from_token(authorization)
    return UserProfileResponse(**{k: user.get(k) for k in [
        "id", "email", "first_name", "last_name", "role",
        "position", "department", "phone_personal", "phone_internal",
        "avatar_url", "is_active",
    ]})


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    authorization: Optional[str] = Header(None),
):
    """Update current user's profile (self-service)."""
    user = _get_user_from_token(authorization)
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        user[k] = v
    return UserProfileResponse(**{k: user.get(k) for k in [
        "id", "email", "first_name", "last_name", "role",
        "position", "department", "phone_personal", "phone_internal",
        "avatar_url", "is_active",
    ]})


# ── Admin: User management ───────────────────────────────────────

@router.get("/users", tags=["Admin"])
async def list_users(authorization: Optional[str] = Header(None)):
    """List all users (admin only)."""
    user = _get_user_from_token(authorization)
    if user["role"] != "admin":
        raise ForbiddenError("Требуются права администратора")

    users_list = []
    for email, u in USERS_DB.items():
        users_list.append({
            "id": u["id"],
            "email": u["email"],
            "first_name": u["first_name"],
            "last_name": u["last_name"],
            "role": u["role"],
            "position": u.get("position", ""),
            "department": u.get("department", ""),
            "phone_personal": u.get("phone_personal", ""),
            "phone_internal": u.get("phone_internal", ""),
            "is_active": u.get("is_active", True),
            "avatar_url": u.get("avatar_url"),
        })

    return {"data": users_list, "total": len(users_list)}


@router.post("/users", status_code=201, tags=["Admin"])
async def create_user(
    data: UserCreateByAdmin,
    authorization: Optional[str] = Header(None),
):
    """Create a new user (admin only)."""
    user = _get_user_from_token(authorization)
    if user["role"] != "admin":
        raise ForbiddenError("Требуются права администратора")

    if data.email in USERS_DB:
        from app.core.exceptions import ConflictError
        raise ConflictError("email", data.email)

    new_id = str(uuid.uuid4())
    new_user = {
        "id": new_id,
        "email": data.email,
        "password": data.password,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "role": data.role,
        "position": data.position or "",
        "department": data.department or "",
        "phone_personal": data.phone_personal or "",
        "phone_internal": data.phone_internal or "",
        "avatar_url": None,
        "is_active": True,
    }
    USERS_DB[data.email] = new_user

    return {"id": new_id, **new_user, "password": "***"}


@router.put("/users/{user_email}", tags=["Admin"])
async def update_user(
    user_email: str,
    data: UserUpdateByAdmin,
    authorization: Optional[str] = Header(None),
):
    """Update a user (admin only)."""
    current = _get_user_from_token(authorization)
    if current["role"] != "admin":
        raise ForbiddenError("Требуются права администратора")

    target = USERS_DB.get(user_email)
    if not target:
        raise NotFoundError(f"User {user_email} not found")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        target[k] = v

    return {"id": target["id"], **{k: v for k, v in target.items() if k != "password"}}


@router.delete("/users/{user_email}", status_code=204, tags=["Admin"])
async def deactivate_user(
    user_email: str,
    authorization: Optional[str] = Header(None),
):
    """Deactivate a user (admin only)."""
    current = _get_user_from_token(authorization)
    if current["role"] != "admin":
        raise ForbiddenError("Требуются права администратора")

    target = USERS_DB.get(user_email)
    if not target:
        raise NotFoundError(f"User {user_email} not found")

    target["is_active"] = False
    return None
