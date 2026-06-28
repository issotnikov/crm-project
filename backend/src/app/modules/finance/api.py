"""
Finance Module — API Router.
Stubs for invoices and payments.
"""
from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/finance")


@router.get("/invoices")
async def list_invoices(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
):
    """List invoices."""
    return {"data": [], "total": 0, "page": page, "per_page": per_page}


@router.post("/invoices", status_code=201)
async def create_invoice(invoice: dict):
    """Create a new invoice."""
    return {"id": "inv-uuid", "number": "INV-2026-0001", **invoice, "status": "draft"}


@router.post("/invoices/{invoice_id}/payments", status_code=201)
async def register_payment(invoice_id: str, payment: dict):
    """Register a payment against an invoice."""
    return {"id": "pay-uuid", "invoice_id": invoice_id, **payment, "status": "confirmed"}


@router.get("/dashboard")
async def finance_dashboard():
    """Financial dashboard summary."""
    return {
        "paid": 4200000,
        "pending": 1100000,
        "overdue": 500000,
        "total_month": 5800000,
    }
