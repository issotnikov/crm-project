"""
1C:Enterprise Integration Module.

Supports:
  - 1C:Accounting (Бухгалтерия предприятия)
  - 1C:ERP (ERP Управление предприятием)
  - 1C:Trade Management (Управление торговлей)
  - 1C:Complex Automation (Комплексная автоматизация)

Features:
  - Bidirectional data exchange (REST API / HTTP-services)
  - Counterparty (Контрагенты) synchronisation
  - Sales orders / Invoices exchange
  - Payment status sync
  - Price lists import
  - OAuth2 / Basic auth support
  - Webhook receiver for 1C events
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from loguru import logger

router = APIRouter(prefix="/1c", tags=["1C Integration"])


# ── Configuration ─────────────────────────────────────────────

class OneCConfig(BaseModel):
    enabled: bool = False
    version: str = Field("8.3", description="1C platform version")
    config_name: str = Field("Бухгалтерия предприятия", description="1C configuration name")
    base_url: str = Field("http://1c.corp.local/CRM_BASE/hs/api",
                           description="1C HTTP-service base URL (published on web-server)")
    auth_type: str = Field("basic", description="basic | oauth2")
    username: str = Field("exchange_user", description="1C user for data exchange")
    password: str = Field("", description="1C user password")
    oauth_token_url: str = Field("", description="OAuth2 token URL (if auth_type=oauth2)")
    oauth_client_id: str = Field("")
    oauth_client_secret: str = Field("")
    # Sync settings
    sync_counterparties: bool = True
    sync_orders: bool = True
    sync_payments: bool = True
    sync_price_lists: bool = False
    # Auto-sync interval (minutes)
    sync_interval: int = Field(15, description="Auto-sync interval in minutes")
    # Webhook settings
    webhook_enabled: bool = True
    webhook_secret: str = Field("", description="Secret for 1C webhook authentication")


# In-memory config
_current_config: Optional[OneCConfig] = None


def get_1c_config() -> Optional[OneCConfig]:
    return _current_config


# ── 1C Data Models ────────────────────────────────────────────

class CounterpartySync(BaseModel):
    """Контрагент для обмена с 1С."""
    ref_key: str = Field(..., description="GUID in 1C (Справочник.Контрагенты)")
    name: str
    full_name: str = ""
    inn: str = ""
    kpp: str = ""
    ogrn: str = ""
    type: str = Field("organization", description="organization | individual")
    legal_address: str = ""
    actual_address: str = ""
    phone: str = ""
    email: str = ""
    manager_name: str = ""
    status: str = "active"


class SalesOrderSync(BaseModel):
    """Заказ покупателя для обмена с 1С."""
    ref_key: str
    number: str
    date: str
    counterparty_ref_key: str
    counterparty_name: str
    amount: float
    currency: str = "RUB"
    status: str = "new"
    manager_name: str = ""
    items: list = Field(default_factory=list)


class PaymentSync(BaseModel):
    """Платёж для обмена с 1С."""
    ref_key: str
    number: str
    date: str
    counterparty_ref_key: str
    counterparty_name: str
    amount: float
    direction: str = "incoming"
    payment_purpose: str = ""


class PriceListSync(BaseModel):
    """Прайс-лист для импорта из 1С."""
    ref_key: str
    name: str
    date: str
    currency: str = "RUB"
    items: list = Field(default_factory=list)


# ── 1C HTTP Client ────────────────────────────────────────────

class OneCClient:
    """HTTP client for 1C HTTP-services (REST API)."""

    def __init__(self, config: OneCConfig):
        self.config = config
        self._token: Optional[str] = None

    def _get_headers(self) -> dict:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.config.auth_type == "oauth2" and self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        elif self.config.auth_type == "basic":
            import base64
            cred = base64.b64encode(
                f"{self.config.username}:{self.config.password}".encode()
            ).decode()
            headers["Authorization"] = f"Basic {cred}"
        return headers

    async def _get_oauth_token(self) -> str:
        """Get OAuth2 token from 1C."""
        data = {
            "grant_type": "client_credentials",
            "client_id": self.config.oauth_client_id,
            "client_secret": self.config.oauth_client_secret,
        }
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            resp = await client.post(self.config.oauth_token_url, data=data)
            resp.raise_for_status()
            return resp.json()["access_token"]

    async def test_connection(self) -> dict:
        """Test connectivity to 1C HTTP-service."""
        try:
            if self.config.auth_type == "oauth2":
                self._token = await self._get_oauth_token()

            url = self.config.base_url.rstrip("/") + "/ping"
            async with httpx.AsyncClient(verify=False, timeout=10) as client:
                resp = await client.get(url, headers=self._get_headers())

            if resp.status_code == 200:
                return {"ok": True, "message": "1C HTTP-service доступен", "config": resp.json()}
            elif resp.status_code == 401:
                return {"ok": False, "error": "Ошибка авторизации: проверьте credentials"}
            elif resp.status_code == 404:
                return {"ok": False, "error": "HTTP-сервис не найден: проверьте URL публикации"}
            else:
                return {"ok": False, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
        except httpx.ConnectError:
            return {"ok": False, "error": "Не удалось подключиться к 1C серверу (connection refused)"}
        except httpx.TimeoutException:
            return {"ok": False, "error": "Таймаут подключения к 1C серверу"}
        except Exception as e:
            return {"ok": False, "error": f"{type(e).__name__}: {e}"}

    async def get_counterparties(self, modified_after: str = None) -> list:
        """Получить контрагентов из 1С."""
        url = self.config.base_url.rstrip("/") + "/counterparties"
        params = {}
        if modified_after:
            params["modified_after"] = modified_after
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            resp = await client.get(url, headers=self._get_headers(), params=params)
            resp.raise_for_status()
            return resp.json().get("items", [])

    async def send_counterparty(self, data: dict) -> dict:
        """Отправить контрагента в 1С (создание/обновление)."""
        url = self.config.base_url.rstrip("/") + "/counterparties"
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            resp = await client.post(url, json=data, headers=self._get_headers())
            resp.raise_for_status()
            return resp.json()

    async def get_orders(self, date_from: str = None, date_to: str = None) -> list:
        """Получить заказы покупателей из 1С."""
        url = self.config.base_url.rstrip("/") + "/orders"
        params = {}
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            resp = await client.get(url, headers=self._get_headers(), params=params)
            resp.raise_for_status()
            return resp.json().get("items", [])

    async def send_order(self, data: dict) -> dict:
        """Отправить заказ в 1С."""
        url = self.config.base_url.rstrip("/") + "/orders"
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            resp = await client.post(url, json=data, headers=self._get_headers())
            resp.raise_for_status()
            return resp.json()

    async def get_payments(self, date_from: str = None) -> list:
        """Получить платежи из 1С."""
        url = self.config.base_url.rstrip("/") + "/payments"
        params = {}
        if date_from:
            params["date_from"] = date_from
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            resp = await client.get(url, headers=self._get_headers(), params=params)
            resp.raise_for_status()
            return resp.json().get("items", [])

    async def get_price_lists(self) -> list:
        """Получить прайс-листы из 1С."""
        url = self.config.base_url.rstrip("/") + "/price_lists"
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            resp = await client.get(url, headers=self._get_headers())
            resp.raise_for_status()
            return resp.json().get("items", [])


# ── Mock sync results ─────────────────────────────────────────

def _mock_sync_result(entity: str) -> dict:
    """Generate mock sync result when 1C is not configured."""
    return {
        "entity": entity,
        "status": "mock",
        "total_received": 5,
        "created": 3,
        "updated": 2,
        "errors": 0,
        "items_preview": [
            {"ref_key": str(uuid.uuid4()), "name": "ООО «Ромашка»", "inn": "7701234567"},
            {"ref_key": str(uuid.uuid4()), "name": "ООО «ТехноЛогик»", "inn": "7707654321"},
            {"ref_key": str(uuid.uuid4()), "name": "ООО «Гамма-Трейд»", "inn": "7805678901"},
        ],
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


# ── API Endpoints ─────────────────────────────────────────────

@router.get("/status")
async def one_c_status():
    """Get current 1C integration status."""
    config = get_1c_config()
    return {
        "enabled": config is not None and config.enabled,
        "config_name": config.config_name if config else None,
        "base_url": config.base_url if config else None,
        "auth_type": config.auth_type if config else None,
        "sync_interval": config.sync_interval if config else None,
    }


@router.get("/config")
async def get_config():
    """Get 1C integration configuration."""
    config = get_1c_config()
    if not config:
        return {"configured": False}
    return {
        "configured": True,
        "enabled": config.enabled,
        "version": config.version,
        "config_name": config.config_name,
        "base_url": config.base_url,
        "auth_type": config.auth_type,
        "username": config.username,
        "sync_counterparties": config.sync_counterparties,
        "sync_orders": config.sync_orders,
        "sync_payments": config.sync_payments,
        "sync_price_lists": config.sync_price_lists,
        "sync_interval": config.sync_interval,
    }


@router.put("/config")
async def update_config(config: OneCConfig):
    """Update 1C integration configuration."""
    global _current_config
    _current_config = config
    logger.info(f"1C config updated: {config.config_name} at {config.base_url}")
    return {"ok": True, "message": "Configuration saved"}


@router.post("/test-connection")
async def test_connection():
    """Test connection to 1C HTTP-service."""
    config = get_1c_config()
    if not config:
        raise HTTPException(400, "1C not configured")
    client = OneCClient(config)
    return await client.test_connection()


@router.post("/sync/counterparties")
async def sync_counterparties(modified_after: str = Query(None)):
    """Синхронизация контрагентов с 1С."""
    config = get_1c_config()
    if not config or not config.enabled:
        return _mock_sync_result("counterparties")
    client = OneCClient(config)
    try:
        items = await client.get_counterparties(modified_after)
        return {
            "entity": "counterparties",
            "status": "ok",
            "total_received": len(items),
            "created": 0,
            "updated": len(items),
            "errors": 0,
            "items_preview": items[:10],
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {"entity": "counterparties", "status": "error", "error": str(e)}


@router.post("/sync/orders")
async def sync_orders(date_from: str = Query(None)):
    """Синхронизация заказов покупателей с 1С."""
    config = get_1c_config()
    if not config or not config.enabled:
        return _mock_sync_result("orders")
    client = OneCClient(config)
    try:
        items = await client.get_orders(date_from)
        return {
            "entity": "orders",
            "status": "ok",
            "total_received": len(items),
            "items_preview": items[:10],
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {"entity": "orders", "status": "error", "error": str(e)}


@router.post("/sync/payments")
async def sync_payments(date_from: str = Query(None)):
    """Синхронизация платежей с 1С."""
    config = get_1c_config()
    if not config or not config.enabled:
        return _mock_sync_result("payments")
    client = OneCClient(config)
    try:
        items = await client.get_payments(date_from)
        return {
            "entity": "payments",
            "status": "ok",
            "total_received": len(items),
            "items_preview": items[:10],
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {"entity": "payments", "status": "error", "error": str(e)}


@router.post("/sync/price-lists")
async def sync_price_lists():
    """Импорт прайс-листов из 1С."""
    config = get_1c_config()
    if not config or not config.enabled:
        return _mock_sync_result("price_lists")
    client = OneCClient(config)
    try:
        items = await client.get_price_lists()
        return {
            "entity": "price_lists",
            "status": "ok",
            "total_received": len(items),
            "items_preview": items[:10],
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {"entity": "price_lists", "status": "error", "error": str(e)}


@router.post("/sync/all")
async def sync_all():
    """Полная синхронизация с 1С (контрагенты + заказы + платежи)."""
    config = get_1c_config()
    if not config or not config.enabled:
        return {
            "status": "mock",
            "results": {
                "counterparties": _mock_sync_result("counterparties"),
                "orders": _mock_sync_result("orders"),
                "payments": _mock_sync_result("payments"),
            },
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }
    client = OneCClient(config)
    results = {}
    try:
        if config.sync_counterparties:
            items = await client.get_counterparties()
            results["counterparties"] = {"total": len(items), "status": "ok"}
    except Exception as e:
        results["counterparties"] = {"status": "error", "error": str(e)}
    try:
        if config.sync_orders:
            items = await client.get_orders()
            results["orders"] = {"total": len(items), "status": "ok"}
    except Exception as e:
        results["orders"] = {"status": "error", "error": str(e)}
    try:
        if config.sync_payments:
            items = await client.get_payments()
            results["payments"] = {"total": len(items), "status": "ok"}
    except Exception as e:
        results["payments"] = {"status": "error", "error": str(e)}
    return {"status": "ok" if all(r.get("status") == "ok" for r in results.values()) else "partial",
            "results": results, "synced_at": datetime.now(timezone.utc).isoformat()}


@router.post("/webhook")
async def one_c_webhook(request: Request, secret: str = Query(None)):
    """
    Webhook receiver for 1C events.
    1C can send POST requests when entities change.
    """
    config = get_1c_config()
    if config and config.webhook_enabled and config.webhook_secret:
        if secret != config.webhook_secret:
            raise HTTPException(401, "Invalid webhook secret")
    body = await request.json()
    event_type = body.get("type", "unknown")
    entity_ref = body.get("ref_key", "")
    logger.info(f"1C webhook received: type={event_type} ref={entity_ref}")
    return {"ok": True, "received": True, "type": event_type}


@router.get("/presets/{config_type}")
async def get_preset(config_type: str):
    """Get recommended configuration preset for a 1C configuration."""
    presets = {
        "accounting": {
            "name": "1С:Бухгалтерия предприятия",
            "config_name": "Бухгалтерия предприятия",
            "version": "8.3",
            "base_url": "http://1c.corp.local/ACCOUNTING/hs/crm_exchange",
            "auth_type": "basic",
            "sync_counterparties": True,
            "sync_orders": True,
            "sync_payments": True,
            "sync_price_lists": False,
            "description": "Обмен с 1С:Бухгалтерия. Синхронизация контрагентов, "
                           "заказов покупателя и платежей. Для обмена требуется "
                           "опубликовать HTTP-сервис и создать пользователя exchange_user. "
                           "Справочники: Контрагенты, ЗаказыПокупателей, ПлатежныеПоручения.",
            "exchange_objects": [
                "Справочник.Контрагенты — двусторонний обмен",
                "Документ.ЗаказПокупателя — приём из CRM",
                "Документ.ПлатежноеПоручение — отправка в CRM",
                "РегистрБухгалтерии.Хозрасчетный — остатки по счетам",
            ],
        },
        "erp": {
            "name": "1С:ERP Управление предприятием",
            "config_name": "1С:ERP",
            "version": "8.3",
            "base_url": "http://1c.corp.local/ERP/hs/crm_exchange",
            "auth_type": "oauth2",
            "oauth_token_url": "http://1c.corp.local/ERP/oauth/token",
            "sync_counterparties": True,
            "sync_orders": True,
            "sync_payments": True,
            "sync_price_lists": True,
            "description": "Обмен с 1С:ERP. Полная синхронизация: контрагенты, "
                           "заказы клиентов, платежи, прайс-листы, номенклатура. "
                           "Поддержка OAuth2 (рекомендуется). "
                           "Использует стандартный HTTP-сервис обмена.",
            "exchange_objects": [
                "Справочник.Контрагенты — двусторонний",
                "Документ.ЗаказКлиента — двусторонний",
                "Документ.ПлатежноеПоручение — входящий",
                "Справочник.Номенклатура — входящий",
                "Справочник.ЦеновыеГруппы — входящий",
                "РегистрСведений.ЦеныНоменклатуры — входящий",
            ],
        },
        "trade_management": {
            "name": "1С:Управление торговлей",
            "config_name": "Управление торговлей",
            "version": "8.3",
            "base_url": "http://1c.corp.local/TRADE/hs/crm_exchange",
            "auth_type": "basic",
            "sync_counterparties": True,
            "sync_orders": True,
            "sync_payments": True,
            "sync_price_lists": True,
            "description": "Обмен с 1С:Управление торговлей. Синхронизация "
                           "контрагентов, заказов покупателя, платежей и прайс-листов. "
                           "Оптимизирован для торговых операций.",
            "exchange_objects": [
                "Справочник.Контрагенты",
                "Документ.ЗаказПокупателя",
                "Документ.ПриходныйКассовыйОрдер",
                "Справочник.Цены",
            ],
        },
        "complex": {
            "name": "1С:Комплексная автоматизация",
            "config_name": "Комплексная автоматизация",
            "version": "8.3",
            "base_url": "http://1c.corp.local/KA/hs/crm_exchange",
            "auth_type": "basic",
            "sync_counterparties": True,
            "sync_orders": True,
            "sync_payments": True,
            "sync_price_lists": False,
            "description": "Обмен с 1С:Комплексная автоматизация. "
                           "Контрагенты, заказы, платежи.",
            "exchange_objects": [
                "Справочник.Контрагенты",
                "Документ.ЗаказПокупателя",
                "Документ.ПлатежноеПоручение",
            ],
        },
    }
    if config_type not in presets:
        raise HTTPException(404, "Preset not found")
    return presets[config_type]
