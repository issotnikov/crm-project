"""
Integrations router — aggregates LDAP and OIDC sub-routers.
"""
from fastapi import APIRouter

from app.modules.integrations.ldap_api import router as ldap_router
from app.modules.integrations.oidc_api import router as oidc_router

router = APIRouter(prefix="/integrations", tags=["Integrations"])
router.include_router(ldap_router)
router.include_router(oidc_router)
