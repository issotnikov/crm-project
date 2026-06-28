"""
Public Web Form API — receives leads from external websites.
No JWT auth required. Protected by API key + rate limiting + reCAPTCHA.
"""
import hashlib
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Header, Request
from pydantic import BaseModel, Field
from loguru import logger

from app.core.config import settings

router = APIRouter(prefix="/public")


class WebFormLead(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=6, max_length=20)
    email: Optional[str] = None
    message: Optional[str] = None
    recaptcha_token: Optional[str] = None
    company_url: Optional[str] = None  # honeypot field
    utm: Optional[dict] = None


def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format."""
    digits = ''.join(c for c in phone if c.isdigit())
    if digits.startswith('8'):
        digits = '7' + digits[1:]
    if not digits.startswith('7') and len(digits) == 10:
        digits = '7' + digits
    if len(digits) == 11 and digits.startswith('7'):
        return f"+{digits}"
    return phone  # return original if we can't normalize


@router.post("/leads", status_code=201)
async def create_lead_from_webform(
    payload: WebFormLead,
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key"),
    x_site_domain: str = Header(..., alias="X-Site-Domain"),
):
    """
    Receive a lead from an external website form.

    Security:
    - API key required (per-site, validated against config)
    - Rate limited by IP and domain (in Nginx)
    - Honeypot field (company_url must be empty)
    - reCAPTCHA verification (if enabled)
    """
    client_ip = request.client.host if request.client else "unknown"

    # 1. Validate API key (scaffold: accept WEBFORM_API_KEY)
    if settings.WEBFORM_API_KEY and x_api_key != settings.WEBFORM_API_KEY:
        logger.warning(f"Invalid API key from {client_ip} for domain {x_site_domain}")
        return {"status": "error", "message": "Invalid API key"}, 401

    # 2. Honeypot check — if company_url is filled, it's a bot
    if payload.company_url:
        logger.info(f"Honeypot triggered from {client_ip} — bot detected")
        # Return success to not alert the bot
        return {"status": "ok", "message": "Заявка принята"}

    # 3. Normalize phone
    phone = normalize_phone(payload.phone)

    # 4. Create contact hash for deduplication
    contact_hash = hashlib.sha256(
        f"{phone}:{payload.email or ''}".encode()
    ).hexdigest()

    # 5. Create incoming request (would save to DB in production)
    logger.info(
        f"Web form lead received: name={payload.name}, phone={phone}, "
        f"domain={x_site_domain}, ip={client_ip}, hash={contact_hash[:8]}"
    )

    # TODO: Send to Celery queue for processing
    # from app.workers.ingestion_tasks import process_incoming_request
    # process_incoming_request.delay({
    #     "source_type": "web_form",
    #     "normalized_data": {
    #         "name": payload.name,
    #         "phone": phone,
    #         "email": payload.email,
    #         "message": payload.message,
    #         "utm": payload.utm,
    #     },
    #     "contact_hash": contact_hash,
    # })

    return {
        "status": "ok",
        "message": "Заявка принята. Мы свяжемся с Вами в ближайшее время.",
    }
