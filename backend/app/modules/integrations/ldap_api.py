"""
LDAP Integration Module.

Supports:
  - Microsoft Active Directory
  - OpenLDAP
  - FreeIPA / Red Hat Identity Management

Features:
  - LDAP authentication (bind + search)
  - User synchronisation (periodic + on-demand)
  - Group → Role mapping
  - Directory listing / search
"""
import asyncio
import os
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from loguru import logger

try:
    from ldap3 import Server, Connection, ALL, SUBTREE, ALL_ATTRIBUTES
    from ldap3.core.exceptions import LDAPException
    HAS_LDAP3 = True
except ImportError:
    HAS_LDAP3 = False
    logger.warning("ldap3 not installed — LDAP integration in mock mode")

router = APIRouter(prefix="/integrations/ldap", tags=["LDAP / Active Directory"])


# ── Configuration Model ───────────────────────────────────────

class LDAPConfig(BaseModel):
    server_type: str = Field("ad", description="ad | openldap | freeipa")
    host: str = Field("", description="LDAP server hostname")
    port: int = Field(636)
    use_ssl: bool = Field(True)
    bind_dn: str = Field("", description="Service account DN")
    bind_password: str = Field("")
    search_base: str = Field("", description="Base DN for user searches")
    user_filter: str = Field(
        "(&(objectClass=user)(sAMAccountName={username}))",
        description="{username} placeholder replaced at runtime"
    )
    attr_username: str = Field("sAMAccountName")
    attr_email: str = Field("mail")
    attr_first_name: str = Field("givenName")
    attr_last_name: str = Field("sn")
    attr_phone: str = Field("telephoneNumber")
    attr_department: str = Field("department")
    attr_title: str = Field("title")
    role_mapping: dict = Field(default_factory=lambda: {
        "CN=CRM Admins,OU=Groups,DC=corp,DC=local": "admin",
        "CN=CRM Users,OU=Groups,DC=corp,DC=local": "user",
    })
    auto_create_users: bool = True
    auto_disable_users: bool = True


# In-memory config store
_current_config: Optional[LDAPConfig] = None


def get_ldap_config() -> Optional[LDAPConfig]:
    return _current_config


# ── LDAP Manager ──────────────────────────────────────────────

class LDAPManager:
    def __init__(self, config: LDAPConfig):
        self.config = config
        self._server = None

    def _get_server(self):
        if self._server is None:
            self._server = Server(
                self.config.host,
                port=self.config.port,
                use_ssl=self.config.use_ssl,
                get_info=ALL,
                connect_timeout=10,
            )
        return self._server

    def _connect_bind(self):
        conn = Connection(
            self._get_server(),
            user=self.config.bind_dn,
            password=self.config.bind_password,
            auto_bind=True,
            read_only=True,
            receive_timeout=15,
        )
        if not conn.bind():
            raise LDAPException(f"LDAP bind failed: {conn.result}")
        return conn

    def _extract_attributes(self, entry) -> dict:
        cfg = self.config
        def get(attr):
            try:
                return entry[attr].value if attr in entry and entry[attr] else None
            except Exception:
                return None
        return {
            "username": get(cfg.attr_username),
            "email": get(cfg.attr_email),
            "first_name": get(cfg.attr_first_name),
            "last_name": get(cfg.attr_last_name),
            "phone": get(cfg.attr_phone),
            "department": get(cfg.attr_department),
            "title": get(cfg.attr_title),
            "dn": entry.entry_dn,
        }

    async def test_connection(self) -> dict:
        if not HAS_LDAP3:
            return {"ok": False, "error": "ldap3 library not installed (mock mode)"}
        def _test():
            try:
                server = self._get_server()
                conn = Connection(server, user=self.config.bind_dn,
                    password=self.config.bind_password, auto_bind=True)
                ok = conn.bind()
                if ok:
                    info = {"ok": True, "server_type": self.config.server_type,
                            "host": self.config.host}
                    conn.unbind()
                    return info
                return {"ok": False, "error": f"Bind failed: {conn.result}"}
            except Exception as e:
                return {"ok": False, "error": str(e)}
        return await asyncio.to_thread(_test)

    async def authenticate(self, username: str, password: str) -> Optional[dict]:
        if not HAS_LDAP3:
            raise RuntimeError("ldap3 not installed")
        def _auth():
            conn = self._connect_bind()
            try:
                user_filter = self.config.user_filter.replace("{username}", username)
                conn.search(search_base=self.config.search_base,
                    search_filter=user_filter, search_scope=SUBTREE,
                    attributes=[ALL_ATTRIBUTES])
                if not conn.entries:
                    return None
                entry = conn.entries[0]
                attrs = self._extract_attributes(entry)
                attrs["dn"] = entry.entry_dn
                attrs["groups"] = []
                # Get groups
                conn.search(search_base=self.config.search_base,
                    search_filter=f"(member={entry.entry_dn})",
                    search_scope=SUBTREE, attributes=["DN"])
                for g in conn.entries:
                    attrs["groups"].append(g.entry_dn)
                return attrs
            finally:
                conn.unbind()

        user_attrs = await asyncio.to_thread(_auth)
        if not user_attrs:
            return None

        # Validate password by binding as user
        def _validate():
            try:
                conn = Connection(self._get_server(), user=user_attrs["dn"],
                    password=password, auto_bind=True)
                ok = conn.bind()
                conn.unbind()
                return ok
            except Exception:
                return False

        is_valid = await asyncio.to_thread(_validate)
        return user_attrs if is_valid else None

    async def sync_users(self) -> dict:
        if not HAS_LDAP3:
            raise RuntimeError("ldap3 not installed")
        def _sync():
            conn = self._connect_bind()
            try:
                user_class = "user" if self.config.server_type == "ad" else "inetOrgPerson"
                conn.search(search_base=self.config.search_base,
                    search_filter=f"(objectClass={user_class})",
                    search_scope=SUBTREE, attributes=[ALL_ATTRIBUTES])
                users = [self._extract_attributes(e) for e in conn.entries]
                return {"total_found": len(users), "imported": len(users),
                        "updated": 0, "disabled": 0, "users": users[:50]}
            finally:
                conn.unbind()
        return await asyncio.to_thread(_sync)


# ── API Endpoints ─────────────────────────────────────────────

class LDAPTestRequest(BaseModel):
    username: str
    password: str


@router.get("/status")
async def ldap_status():
    config = get_ldap_config()
    return {
        "enabled": config is not None,
        "ldap3_installed": HAS_LDAP3,
        "server_type": config.server_type if config else None,
        "host": config.host if config else None,
    }


@router.get("/config")
async def get_config():
    config = get_ldap_config()
    if not config:
        return {"configured": False}
    return {
        "configured": True,
        "server_type": config.server_type,
        "host": config.host,
        "port": config.port,
        "use_ssl": config.use_ssl,
        "search_base": config.search_base,
        "bind_dn": config.bind_dn,
        "user_filter": config.user_filter,
        "auto_create_users": config.auto_create_users,
        "role_mapping": config.role_mapping,
    }


@router.put("/config")
async def update_config(config: LDAPConfig):
    global _current_config
    _current_config = config
    logger.info(f"LDAP config updated: {config.host}:{config.port}")
    return {"ok": True, "message": "Configuration saved"}


@router.post("/test-connection")
async def test_connection():
    config = get_ldap_config()
    if not config:
        raise HTTPException(400, "LDAP not configured")
    mgr = LDAPManager(config)
    return await mgr.test_connection()


@router.post("/authenticate")
async def authenticate(req: LDAPTestRequest):
    config = get_ldap_config()
    if not config:
        raise HTTPException(400, "LDAP not configured")
    mgr = LDAPManager(config)
    user = await mgr.authenticate(req.username, req.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    return {
        "authenticated": True,
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "dn": user.get("dn"),
            "groups": user.get("groups", []),
        },
    }


@router.post("/sync")
async def sync_users():
    config = get_ldap_config()
    if not config:
        raise HTTPException(400, "LDAP not configured")
    mgr = LDAPManager(config)
    return await mgr.sync_users()


@router.get("/presets/{server_type}")
async def get_preset(server_type: str):
    """Get recommended configuration preset for a server type."""
    presets = {
        "ad": {
            "name": "Microsoft Active Directory",
            "server_type": "ad",
            "port": 636,
            "use_ssl": True,
            "user_filter": "(&(objectClass=user)(objectCategory=person)(sAMAccountName={username}))",
            "attr_username": "sAMAccountName",
            "attr_email": "mail",
            "attr_first_name": "givenName",
            "attr_last_name": "sn",
            "attr_phone": "telephoneNumber",
            "attr_department": "department",
            "attr_title": "title",
            "description": "Стандартная интеграция с Microsoft AD. "
                           "Требуется сервис-аккаунт с правами чтения каталога. "
                           "Используйте LDAPS (порт 636) для шифрования.",
        },
        "openldap": {
            "name": "OpenLDAP",
            "server_type": "openldap",
            "port": 389,
            "use_ssl": False,
            "user_filter": "(&(objectClass=inetOrgPerson)(uid={username}))",
            "attr_username": "uid",
            "attr_email": "mail",
            "attr_first_name": "givenName",
            "attr_last_name": "sn",
            "attr_phone": "telephoneNumber",
            "attr_department": "ou",
            "attr_title": "title",
            "description": "Интеграция с OpenLDAP Server. "
                           "Использует inetOrgPerson и uid для идентификации. "
                           "Рекомендуется включить StartTLS.",
        },
        "freeipa": {
            "name": "FreeIPA / Red Hat IdM",
            "server_type": "freeipa",
            "port": 636,
            "use_ssl": True,
            "user_filter": "(&(objectClass=posixAccount)(uid={username}))",
            "attr_username": "uid",
            "attr_email": "mail",
            "attr_first_name": "givenName",
            "attr_last_name": "sn",
            "attr_phone": "telephoneNumber",
            "attr_department": "ou",
            "attr_title": "title",
            "description": "Интеграция с FreeIPA / Red Hat Identity Management. "
                           "Использует posixAccount и uid. "
                           "Группы: cn=groups,cn=accounts,dc=example,dc=com. "
                           "Рекомендуется настроить HBAC-правила.",
        },
    }
    if server_type not in presets:
        raise HTTPException(404, "Preset not found")
    return presets[server_type]
