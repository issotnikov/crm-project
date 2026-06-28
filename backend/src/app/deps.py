"""
FastAPI dependency injection: authentication, database, pagination.
"""
from typing import Annotated, Optional
import uuid

from fastapi import Depends, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.core.security import decode_token

security_scheme = HTTPBearer(auto_error=False)


class PaginationParams:
    """Common pagination query parameters."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.per_page = per_page

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        return self.per_page


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Extract and validate the JWT token, returning the current user.
    In production this would load from the database; for the scaffold
    we return a minimal user dict.
    """
    if credentials is None:
        raise UnauthorizedError("Missing authentication token")

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Token missing subject")

    # In production: load user from DB and check is_active
    return {
        "id": uuid.UUID(user_id),
        "email": payload.get("email", ""),
        "role": payload.get("role", "readonly"),
        "permissions": payload.get("permissions", []),
    }


def require_permission(permission_code: str):
    """
    Dependency factory: requires the current user to have a specific permission.
    Usage: @router.get(..., dependencies=[Depends(require_permission("crm.customers.read"))])
    """
    async def check_permission(
        current_user: Annotated[dict, Depends(get_current_user)],
    ) -> dict:
        if "admin" == current_user.get("role"):
            return current_user
        if permission_code not in current_user.get("permissions", []):
            raise ForbiddenError(f"Missing permission: {permission_code}")
        return current_user

    return check_permission


# Type aliases for cleaner function signatures
CurrentUser = Annotated[dict, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
Pagination = Annotated[PaginationParams, Depends()]
