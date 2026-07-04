"""
OIDC (OpenID Connect) Integration Module — Keycloak, Okta, Auth0, etc.

Features:
  - Authorization Code Flow with PKCE
  - Token introspection & validation
  - User info extraction
  - Automatic JWT issuance (CRM-local after OIDC auth)
  - Group/Role mapping from Keycloak realm roles
"""
import os
import time
import secrets
import hashlib
import base64
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from loguru import logger
from jose import jwt as jose_jwt

from app.core.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/integrations/oidc", tags=["OIDC / Keycloak"])


# ── Configuration Model ───────────────────────────────────────

class OIDCConfig(BaseModel):
    enabled: bool = False
    provider_name: str = Field("Keycloak", description="Display name")
    issuer_url: str = Field("https://keycloak.corp.local/realms/myrealm",
                             description="OIDC issuer URL (realm URL)")
    client_id: str = Field("crm-system", description="OAuth2 client ID")
    client_secret: str = Field("", description="OAuth2 client secret")
    scopes: list = Field(["openid", "profile", "email"])
    # Endpoints (auto-discovered from .well-known/openid-configuration)
    authorization_endpoint: str = ""
    token_endpoint: str = ""
    userinfo_endpoint: str = ""
    introspection_endpoint: str = ""
    jwks_uri: str = ""
    # Role mapping
    role_claim: str = Field("realm_access.roles", description="JWT claim for roles")
    admin_roles: list = Field(["crm-admin", "admin"], description="Roles granting CRM admin")
    user_roles: list = Field(["crm-user", "user", "default-roles-myrealm"],
                              description="Roles granting CRM user")
    auto_create_users: bool = True
    # Frontend redirect after login
    redirect_after_login: str = Field("/", description="Frontend URL after successful OIDC login")


# In-memory stores
_current_config: Optional[OIDCConfig] = None
# PKCE state store: {state: {"verifier": str, "redirect": str, "created": float}}
_pkce_store: dict = {}


def get_oidc_config() -> Optional[OIDCConfig]:
    return _current_config


# ── OIDC Flow Helpers ─────────────────────────────────────────

def _generate_pkce() -> tuple:
    """Generate PKCE code_verifier and code_challenge."""
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).decode().rstrip("=")
    return verifier, challenge


def _save_state(state: str, verifier: str, redirect: str):
    _pkce_store[state] = {
        "verifier": verifier,
        "redirect": redirect,
        "created": time.time(),
    }
    # Clean old states (> 10 min)
    cutoff = time.time() - 600
    _pkce_store.update({k: v for k, v in _pkce_store.items() if v["created"] > cutoff})


async def _discover_endpoints(config: OIDCConfig) -> dict:
    """Auto-discover OIDC endpoints from .well-known configuration."""
    well_known_url = config.issuer_url.rstrip("/") + "/.well-known/openid-configuration"
    async with httpx.AsyncClient(verify=False, timeout=10) as client:
        resp = await client.get(well_known_url)
        resp.raise_for_status()
        return resp.json()


async def _exchange_code(config: OIDCConfig, code: str, redirect_uri: str,
                         code_verifier: str) -> dict:
    """Exchange authorization code for tokens."""
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": config.client_id,
        "client_secret": config.client_secret,
        "code_verifier": code_verifier,
    }
    async with httpx.AsyncClient(verify=False, timeout=15) as client:
        resp = await client.post(config.token_endpoint, data=data)
        if resp.status_code != 200:
            logger.error(f"OIDC token exchange failed: {resp.status_code} {resp.text}")
            raise HTTPException(400, f"Token exchange failed: {resp.text}")
        return resp.json()


async def _get_userinfo(config: OIDCConfig, access_token: str) -> dict:
    """Get user info from OIDC provider."""
    async with httpx.AsyncClient(verify=False, timeout=10) as client:
        resp = await client.get(
            config.userinfo_endpoint,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(400, f"UserInfo request failed: {resp.status_code}")
        return resp.json()


def _extract_roles(claims: dict, config: OIDCConfig) -> list:
    """Extract roles from JWT/UserInfo claims."""
    parts = config.role_claim.split(".")
    val = claims
    for part in parts:
        if isinstance(val, dict):
            val = val.get(part, {})
        else:
            return []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        return [val]
    return []


def _map_role(oidc_roles: list, config: OIDCConfig) -> str:
    """Map OIDC roles to CRM role."""
    for admin_role in config.admin_roles:
        if admin_role in oidc_roles:
            return "admin"
    for user_role in config.user_roles:
        if user_role in oidc_roles:
            return "user"
    return "user"  # Default


# ── API Endpoints ─────────────────────────────────────────────

@router.get("/status")
async def oidc_status():
    config = get_oidc_config()
    return {
        "enabled": config is not None and config.enabled,
        "provider": config.provider_name if config else None,
        "issuer": config.issuer_url if config else None,
        "client_id": config.client_id if config else None,
    }


@router.get("/config")
async def get_config():
    config = get_oidc_config()
    if not config:
        return {"configured": False}
    return {
        "configured": True,
        "enabled": config.enabled,
        "provider_name": config.provider_name,
        "issuer_url": config.issuer_url,
        "client_id": config.client_id,
        "scopes": config.scopes,
        "auto_create_users": config.auto_create_users,
        "admin_roles": config.admin_roles,
        "user_roles": config.user_roles,
    }


@router.put("/config")
async def update_config(config: OIDCConfig):
    global _current_config
    _current_config = config
    logger.info(f"OIDC config updated: {config.provider_name} ({config.issuer_url})")
    return {"ok": True, "message": "Configuration saved"}


@router.post("/discover")
async def discover_endpoints(issuer_url: str = ""):
    """Auto-discover OIDC endpoints from .well-known configuration."""
    url = issuer_url.rstrip("/") + "/.well-known/openid-configuration"
    try:
        async with httpx.AsyncClient(verify=False, timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        return {
            "ok": True,
            "issuer": data.get("issuer"),
            "authorization_endpoint": data.get("authorization_endpoint"),
            "token_endpoint": data.get("token_endpoint"),
            "userinfo_endpoint": data.get("userinfo_endpoint"),
            "introspection_endpoint": data.get("introspection_endpoint"),
            "jwks_uri": data.get("jwks_uri"),
            "scopes_supported": data.get("scopes_supported", []),
            "grant_types_supported": data.get("grants_supported", []),
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/login")
async def oidc_login(request: Request, redirect: str = "/"):
    """
    Initiate OIDC Authorization Code Flow with PKCE.
    Redirects user to Keycloak / IdP login page.
    """
    config = get_oidc_config()
    if not config or not config.enabled:
        raise HTTPException(400, "OIDC not configured or disabled")

    # Auto-discover if endpoints not set
    if not config.authorization_endpoint:
        try:
            endpoints = await _discover_endpoints(config)
            config.authorization_endpoint = endpoints.get("authorization_endpoint", "")
            config.token_endpoint = endpoints.get("token_endpoint", "")
            config.userinfo_endpoint = endpoints.get("userinfo_endpoint", "")
            config.jwks_uri = endpoints.get("jwks_uri", "")
        except Exception as e:
            raise HTTPException(500, f"Failed to discover OIDC endpoints: {e}")

    # Generate PKCE
    verifier, challenge = _generate_pkce()
    state = secrets.token_urlsafe(32)
    _save_state(state, verifier, redirect)

    # Build authorization URL
    base_url = str(request.base_url).rstrip("/")
    redirect_uri = f"{base_url}/api/v1/integrations/oidc/callback"

    params = {
        "response_type": "code",
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "scope": " ".join(config.scopes),
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    auth_url = f"{config.authorization_endpoint}?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def oidc_callback(
    request: Request,
    code: str = "",
    state: str = "",
    error: str = "",
    error_description: str = "",
):
    """
    OIDC callback — exchange code for tokens, issue CRM JWT.
    Redirects to frontend with tokens.
    """
    config = get_oidc_config()
    if not config or not config.enabled:
        raise HTTPException(400, "OIDC not configured")

    if error:
        logger.error(f"OIDC callback error: {error} — {error_description}")
        return RedirectResponse(url=f"/?oidc_error={error}")

    if state not in _pkce_store:
        raise HTTPException(400, "Invalid or expired OIDC state")

    pkce_data = _pkce_store.pop(state)
    verifier = pkce_data["verifier"]
    redirect_to = pkce_data["redirect"]

    base_url = str(request.base_url).rstrip("/")
    redirect_uri = f"{base_url}/api/v1/integrations/oidc/callback"

    # Exchange code for tokens
    try:
        tokens = await _exchange_code(config, code, redirect_uri, verifier)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Token exchange failed: {e}")

    oidc_access_token = tokens.get("access_token")
    oidc_id_token = tokens.get("id_token")

    # Get user info
    try:
        userinfo = await _get_userinfo(config, oidc_access_token)
    except Exception as e:
        logger.error(f"OIDC userinfo failed: {e}")
        # Fall back to decoding ID token
        try:
            userinfo = jose_jwt.get_unverified_claims(oidc_id_token)
        except Exception:
            raise HTTPException(500, "Failed to get user info")

    # Extract identity
    email = userinfo.get("email") or userinfo.get("preferred_username", "")
    first_name = userinfo.get("given_name", "")
    last_name = userinfo.get("family_name", "")
    oidc_roles = _extract_roles(userinfo, config)
    crm_role = _map_role(oidc_roles, config)

    logger.info(f"OIDC login: {email} roles={oidc_roles} → crm_role={crm_role}")

    # Issue CRM-local JWT
    crm_user = {
        "email": email,
        "name": f"{first_name} {last_name}".strip() or email,
        "role": crm_role,
    }
    access_token = create_access_token(crm_user)
    refresh_token = create_refresh_token(crm_user)

    # Redirect to frontend with tokens
    frontend_url = config.redirect_after_login or "/"
    redirect_params = urlencode({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "email": email,
        "name": crm_user["name"],
        "role": crm_role,
    })
    return RedirectResponse(url=f"{frontend_url}#oidc={redirect_params}")


@router.post("/introspect")
async def introspect_token(token: str = ""):
    """Introspect an OIDC access token (requires introspection endpoint)."""
    config = get_oidc_config()
    if not config or not config.enabled:
        raise HTTPException(400, "OIDC not configured")
    if not config.introspection_endpoint:
        raise HTTPException(400, "Introspection endpoint not configured")

    data = {
        "token": token,
        "client_id": config.client_id,
        "client_secret": config.client_secret,
    }
    async with httpx.AsyncClient(verify=False, timeout=10) as client:
        resp = await client.post(config.introspection_endpoint, data=data)
        return resp.json()


@router.get("/presets/{provider}")
async def get_preset(provider: str):
    """Get recommended configuration preset for a known provider."""
    presets = {
        "keycloak": {
            "name": "Keycloak",
            "issuer_url": "https://keycloak.corp.local/realms/myrealm",
            "client_id": "crm-system",
            "scopes": ["openid", "profile", "email"],
            "role_claim": "realm_access.roles",
            "admin_roles": ["crm-admin"],
            "user_roles": ["crm-user", "default-roles-myrealm"],
            "description": "Keycloak — open-source Identity & Access Management. "
                           "Создайте client 'crm-system' в realm с Authorization Code Flow + PKCE. "
                           "Назначьте roles 'crm-admin' и 'crm-user'. "
                           "Mappers: email, given_name, family_name, realm roles.",
        },
        "okta": {
            "name": "Okta",
            "issuer_url": "https://yourorg.okta.com",
            "client_id": "0oa...",
            "scopes": ["openid", "profile", "email", "groups"],
            "role_claim": "groups",
            "admin_roles": ["CRMAdmins"],
            "user_roles": ["CRMUsers"],
            "description": "Okta — cloud Identity provider. "
                           "Создайте OIDC application с Authorization Code + PKCE. "
                           "Group claims: CRMAdmins, CRMUsers.",
        },
        "auth0": {
            "name": "Auth0",
            "issuer_url": "https://yourorg.eu.auth0.com",
            "client_id": "...",
            "scopes": ["openid", "profile", "email", "roles"],
            "role_claim": "https://api.roles",
            "admin_roles": ["admin"],
            "user_roles": ["user"],
            "description": "Auth0 — cloud Identity platform. "
                           "Создайте Regular Web Application с OIDC. "
                           "Add API, configure RBAC roles.",
        },
        "azuread": {
            "name": "Microsoft Entra ID (Azure AD)",
            "issuer_url": "https://login.microsoftonline.com/{tenant-id}/v2.0",
            "client_id": "...",
            "scopes": ["openid", "profile", "email", "User.Read"],
            "role_claim": "roles",
            "admin_roles": ["CRM.Admin"],
            "user_roles": ["CRM.User"],
            "description": "Microsoft Entra ID (бывший Azure AD). "
                           "Register Application, configure redirect URI. "
                           "App roles: CRM.Admin, CRM.User. "
                           "Expose API with scope.",
        },
    }
    if provider not in presets:
        raise HTTPException(404, "Preset not found")
    return presets[provider]
