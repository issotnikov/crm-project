"""
Admin Module — API Router (users, roles, settings).
Stubs for user management endpoints.
"""
from fastapi import APIRouter

router = APIRouter()

# Import auth router and merge
from app.modules.admin.auth_api import router as auth_router
router.include_router(auth_router)


@router.get("/users", tags=["Admin"])
async def list_users(page: int = 1, per_page: int = 20):
    """List all users (admin only)."""
    return {"data": [], "total": 0, "page": page, "per_page": per_page}


@router.get("/roles", tags=["Admin"])
async def list_roles():
    """List all roles."""
    return {
        "data": [
            {"id": "00000000-0000-0000-0000-000000000001", "name": "admin", "description": "Полный доступ"},
            {"id": "00000000-0000-0000-0000-000000000002", "name": "manager", "description": "Менеджер продаж"},
            {"id": "00000000-0000-0000-0000-000000000003", "name": "sales", "description": "Продавец"},
            {"id": "00000000-0000-0000-0000-000000000004", "name": "finance", "description": "Финансовый отдел"},
            {"id": "00000000-0000-0000-0000-000000000005", "name": "executor", "description": "Исполнитель"},
            {"id": "00000000-0000-0000-0000-000000000006", "name": "readonly", "description": "Только чтение"},
        ]
    }
