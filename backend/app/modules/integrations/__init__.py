"""
Integrations router — aggregates LDAP, OIDC, and 1C sub-routers.
"""
from fastapi import APIRouter

from app.modules.integrations.ldap_api import router as ldap_router
from app.modules.integrations.oidc_api import router as oidc_router
from app.modules.integrations.one_c_api import router as one_c_router

router = APIRouter(prefix="/integrations", tags=["Integrations"])
router.include_router(ldap_router)
router.include_router(oidc_router)
router.include_router(one_c_router)
