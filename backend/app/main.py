"""
CRM System — Backend Application
FastAPI entry point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import CRMApiError
from app.core.middleware import RequestIdMiddleware, AuditLogMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting CRM API in {settings.APP_ENV} mode...")
    yield
    logger.info("Shutting down CRM API...")
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="CRM System API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/api/v1/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(AuditLogMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS_LIST,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(CRMApiError)
    async def crm_error_handler(request: Request, exc: CRMApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.error_code, "message": exc.message, "details": exc.details}},
        )

    from app.modules.admin.api import router as admin_router
    from app.modules.mock_api import router as mock_router
    from app.modules.tasks_mock import router as tasks_mock_router
    from app.modules.finance_mock import router as finance_mock_router
    from app.modules.documents_mock import router as documents_mock_router
    from app.modules.analytics_mock import router as analytics_mock_router
    from app.modules.integrations import router as integrations_router
    from app.modules.api_catalog import router as catalog_router
    from app.modules.crm.api import router as crm_router
    from app.modules.finance.api import router as finance_router
    from app.modules.documents.api import router as documents_router
    from app.modules.analytics.api import router as analytics_router
    from app.integrations.webform.api import router as public_router
    from app.integrations.telephony.api import router as webhook_router

    api_prefix = "/api/v1"

    app.include_router(admin_router, prefix=api_prefix, tags=["Admin"])
    app.include_router(mock_router, prefix=api_prefix, tags=["Mock Data"])
    app.include_router(tasks_mock_router, prefix=api_prefix, tags=["Tasks"])
    app.include_router(finance_mock_router, prefix=api_prefix, tags=["Finance"])
    app.include_router(documents_mock_router, prefix=api_prefix, tags=["Documents"])
    app.include_router(analytics_mock_router, prefix=api_prefix, tags=["Analytics"])
    app.include_router(integrations_router, prefix=api_prefix, tags=["Integrations"])
    app.include_router(catalog_router, prefix=api_prefix, tags=["API Catalog"])
    app.include_router(crm_router, prefix=api_prefix, tags=["CRM"])
    app.include_router(finance_router, prefix=api_prefix, tags=["Finance (stub)"])
    app.include_router(documents_router, prefix=api_prefix, tags=["Documents (stub)"])
    app.include_router(analytics_router, prefix=api_prefix, tags=["Analytics"])
    app.include_router(public_router, prefix=api_prefix, tags=["Public"])
    app.include_router(webhook_router, prefix=api_prefix, tags=["Webhooks"])

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}

    return app


app = create_app()
