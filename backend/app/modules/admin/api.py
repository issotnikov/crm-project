"""
Admin Module — API Router.
Imports auth_api which has all endpoints: login, profile, users.
"""
from fastapi import APIRouter

router = APIRouter()

# Import auth router (contains all /auth/* endpoints)
from app.modules.admin.auth_api import router as auth_router
router.include_router(auth_router)
