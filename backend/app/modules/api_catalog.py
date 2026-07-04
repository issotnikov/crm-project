"""
API Catalog — structured documentation of all available endpoints.
Accessible at GET /api/v1/api-catalog
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api-catalog", tags=["API Documentation"])

CATALOG = {
    "version": "2.0.0",
    "base_url": "/api/v1",
    "auth": {
        "type": "JWT Bearer",
        "header": "Authorization: Bearer <token>",
        "endpoints": {
            "login": "POST /auth/login — Вход по email+пароль, возвращает access+refresh JWT",
            "refresh": "POST /auth/refresh — Обновление access token",
            "profile": "GET /auth/profile — Текущий профиль пользователя",
            "update_profile": "PUT /auth/profile — Обновление профиля",
            "users_list": "GET /auth/users — Список пользователей (только admin)",
            "user_create": "POST /auth/users — Создание пользователя (только admin)",
            "user_update": "PUT /auth/users/{email} — Обновление пользователя (только admin)",
        },
    },
    "modules": [
        {
            "name": "CRM — Клиенты",
            "icon": "👥",
            "base": "/mock/customers",
            "endpoints": [
                {"method": "GET", "path": "/mock/customers", "desc": "Список клиентов с поиском (?search=)"},
                {"method": "GET", "path": "/mock/customers/{id}", "desc": "Карточка клиента с контактами, взаимодействиями, сделками"},
                {"method": "POST", "path": "/mock/customers", "desc": "Создание клиента"},
            ],
        },
        {
            "name": "CRM — Заявки (Лиды)",
            "icon": "📥",
            "base": "/mock/leads",
            "endpoints": [
                {"method": "GET", "path": "/mock/leads", "desc": "Список заявок (?status=, ?source=)"},
                {"method": "GET", "path": "/mock/leads/{id}", "desc": "Детальная карточка заявки с историей"},
                {"method": "POST", "path": "/mock/leads", "desc": "Создание заявки"},
            ],
        },
        {
            "name": "CRM — Сделки",
            "icon": "🎯",
            "base": "/mock/deals",
            "endpoints": [
                {"method": "GET", "path": "/mock/deals", "desc": "Список сделок (?status=open|won|lost)"},
                {"method": "GET", "path": "/mock/deals/{id}", "desc": "Карточка сделки с задачами и документами"},
                {"method": "POST", "path": "/mock/deals", "desc": "Создание сделки"},
            ],
        },
        {
            "name": "Задачи",
            "icon": "✅",
            "base": "/mock/tasks",
            "endpoints": [
                {"method": "GET", "path": "/mock/tasks/", "desc": "Список задач (?status=, ?priority=, ?overdue=)"},
                {"method": "GET", "path": "/mock/tasks/reminders", "desc": "Напоминания: просроченные + ближайшие задачи"},
                {"method": "GET", "path": "/mock/tasks/{id}", "desc": "Карточка задачи с чек-листом и комментариями"},
                {"method": "POST", "path": "/mock/tasks/", "desc": "Создание задачи"},
                {"method": "PATCH", "path": "/mock/tasks/{id}", "desc": "Обновление задачи (статус, приоритет, чек-лист)"},
            ],
        },
        {
            "name": "Календарь",
            "icon": "📅",
            "base": "/mock/tasks/calendar",
            "endpoints": [
                {"method": "GET", "path": "/mock/tasks/calendar/events", "desc": "События календаря (?start=, ?end=)"},
                {"method": "POST", "path": "/mock/tasks/calendar/events", "desc": "Создание события"},
            ],
        },
        {
            "name": "Финансы",
            "icon": "💰",
            "base": "/mock/finance",
            "endpoints": [
                {"method": "GET", "path": "/mock/finance/dashboard", "desc": "KPI: оплачено, ожидает, просрочено, динамика"},
                {"method": "GET", "path": "/mock/finance/invoices", "desc": "Список счетов (?status=paid|sent|overdue|draft)"},
                {"method": "GET", "path": "/mock/finance/invoices/{id}", "desc": "Карточка счёта с позициями и оплатами"},
                {"method": "POST", "path": "/mock/finance/invoices", "desc": "Создание счёта"},
                {"method": "POST", "path": "/mock/finance/invoices/{id}/payments", "desc": "Регистрация оплаты по счёту"},
            ],
        },
        {
            "name": "Документы",
            "icon": "📄",
            "base": "/mock/documents",
            "endpoints": [
                {"method": "GET", "path": "/mock/documents/", "desc": "Список документов (?type=, ?status=)"},
                {"method": "GET", "path": "/mock/documents/templates", "desc": "Каталог шаблонов документов"},
                {"method": "GET", "path": "/mock/documents/{id}", "desc": "Карточка документа с версиями"},
                {"method": "POST", "path": "/mock/documents/generate", "desc": "Генерация документа из шаблона"},
                {"method": "POST", "path": "/mock/documents/{id}/send", "desc": "Отправка документа клиенту"},
            ],
        },
        {
            "name": "Аналитика",
            "icon": "📈",
            "base": "/mock/analytics",
            "endpoints": [
                {"method": "GET", "path": "/mock/analytics/overview", "desc": "KPI: лиды, сделки, выручка, конверсии (?period=week|month|quarter|year)"},
                {"method": "GET", "path": "/mock/analytics/funnel", "desc": "Воронка продаж с конверсиями и причинами проигрыша"},
                {"method": "GET", "path": "/mock/analytics/managers", "desc": "Эффективность сотрудников (выручка, SLA, задачи)"},
                {"method": "GET", "path": "/mock/analytics/sources", "desc": "ROI по источникам лидов (CPL, конверсия)"},
                {"method": "GET", "path": "/mock/analytics/revenue-chart", "desc": "Динамика выручки и лидов по месяцам"},
                {"method": "GET", "path": "/mock/analytics/activity-heatmap", "desc": "Тепловая карта активности по дням и часам"},
            ],
        },
        {
            "name": "Интеграции — LDAP / Active Directory",
            "icon": "🔑",
            "base": "/integrations/ldap",
            "endpoints": [
                {"method": "GET", "path": "/integrations/ldap/status", "desc": "Статус LDAP интеграции"},
                {"method": "GET", "path": "/integrations/ldap/config", "desc": "Текущая конфигурация LDAP"},
                {"method": "PUT", "path": "/integrations/ldap/config", "desc": "Сохранение конфигурации LDAP"},
                {"method": "POST", "path": "/integrations/ldap/test-connection", "desc": "Тест подключения к LDAP серверу"},
                {"method": "POST", "path": "/integrations/ldap/authenticate", "desc": "Аутентификация пользователя через LDAP"},
                {"method": "POST", "path": "/integrations/ldap/sync", "desc": "Синхронизация пользователей из LDAP"},
                {"method": "GET", "path": "/integrations/ldap/presets/{server_type}", "desc": "Пресет настроек: ad | openldap | freeipa"},
            ],
        },
        {
            "name": "Интеграции — OIDC / Keycloak",
            "icon": "🔐",
            "base": "/integrations/oidc",
            "endpoints": [
                {"method": "GET", "path": "/integrations/oidc/status", "desc": "Статус OIDC интеграции"},
                {"method": "GET", "path": "/integrations/oidc/config", "desc": "Текущая конфигурация OIDC"},
                {"method": "PUT", "path": "/integrations/oidc/config", "desc": "Сохранение конфигурации OIDC"},
                {"method": "POST", "path": "/integrations/oidc/discover", "desc": "Auto-discovery через .well-known/openid-configuration"},
                {"method": "GET", "path": "/integrations/oidc/login", "desc": "Инициация OIDC Authorization Code Flow с PKCE"},
                {"method": "GET", "path": "/integrations/oidc/callback", "desc": "Callback — обмен code на token, выдача CRM JWT"},
                {"method": "POST", "path": "/integrations/oidc/introspect", "desc": "Интроспекция OIDC access token"},
                {"method": "GET", "path": "/integrations/oidc/presets/{provider}", "desc": "Пресет: keycloak | okta | auth0 | azuread"},
            ],
        },
        {
            "name": "Webhooks — Внешние системы",
            "icon": "🔌",
            "base": "/webhooks",
            "endpoints": [
                {"method": "POST", "path": "/leads", "desc": "Приём заявки из web-формы сайта (api-key auth)"},
                {"method": "POST", "path": "/telephony", "desc": "Webhook от IP-телефонии (входящий/завершённый звонок)"},
            ],
        },
    ],
    "integration_guides": {
        "ldap_ad": {
            "title": "Подключение Microsoft Active Directory",
            "steps": [
                "1. Создайте сервис-аккаунт (svc_crm) в AD с правами чтения каталога",
                "2. Настройте LDAPS (порт 636) — сертификат сервера",
                "3. PUT /integrations/ldap/config с server_type=ad",
                "4. POST /integrations/ldap/test-connection — проверка",
                "5. Настройте role_mapping: AD группы → CRM роли (admin/user)",
                "6. POST /integrations/ldap/sync — импорт пользователей",
            ],
        },
        "ldap_openldap": {
            "title": "Подключение OpenLDAP",
            "steps": [
                "1. Создайте bind-аккаунт с правами чтения (cn=svc_crm)",
                "2. Рекомендуется StartTLS на порту 389",
                "3. PUT /integrations/ldap/config с server_type=openldap",
                "4. Фильтр: (&(objectClass=inetOrgPerson)(uid={username}))",
                "5. POST /integrations/ldap/test-connection",
                "6. Настройте role_mapping по POSIX-группам",
            ],
        },
        "ldap_freeipa": {
            "title": "Подключение FreeIPA",
            "steps": [
                "1. Создайте сервис-аккаунт во FreeIPA",
                "2. Настройте HBAC-правила для CRM-доступа",
                "3. PUT /integrations/ldap/config с server_type=freeipa",
                "4. Фильтр: (&(objectClass=posixAccount)(uid={username}))",
                "5. POST /integrations/ldap/sync — синхронизация",
                "6. Mapping по IPA groups (cn=groups,cn=accounts,...)",
            ],
        },
        "oidc_keycloak": {
            "title": "Подключение Keycloak (OIDC)",
            "steps": [
                "1. В Keycloak: создайте client 'crm-system' в realm",
                "2. Включите Authorization Code Flow + PKCE",
                "3. Добавьте Valid Redirect URI: https://crm.corp.local/api/v1/integrations/oidc/callback",
                "4. Создайте realm roles: crm-admin, crm-user",
                "5. PUT /integrations/oidc/config с issuer_url, client_id, client_secret",
                "6. POST /integrations/oidc/discover — auto-discovery endpoints",
                "7. GET /integrations/oidc/login — тест входа через Keycloak",
                "8. Настройте mappers: email, given_name, family_name, realm roles",
            ],
        },
    },
}


@router.get("/")
async def get_api_catalog():
    """Full API catalog with documentation."""
    return CATALOG


@router.get("/summary")
async def get_api_summary():
    """Compact endpoint count summary."""
    total = 0
    for module in CATALOG["modules"]:
        total += len(module["endpoints"])
    return {
        "version": CATALOG["version"],
        "modules": len(CATALOG["modules"]),
        "total_endpoints": total,
        "auth_endpoints": len(CATALOG["auth"]["endpoints"]),
        "integration_guides": len(CATALOG["integration_guides"]),
    }
