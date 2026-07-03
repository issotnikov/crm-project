"""
Mock API for Finance: invoices and payments.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock/finance", tags=["Mock Finance"])

NOW = datetime.now(timezone.utc)
DAYS_AGO = lambda d: (NOW - timedelta(days=d)).strftime("%Y-%m-%d")
DAYS_AHEAD = lambda d: (NOW + timedelta(days=d)).strftime("%Y-%m-%d")

MOCK_INVOICES = [
    {
        "id": "inv10000-0000-0000-0000-000000000001",
        "number": "INV-2026-0001",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_id": "d1000000-0000-0000-0000-000000000002",
        "deal_name": "Комплексная автоматизация бизнеса",
        "issue_date": DAYS_AGO(5),
        "due_date": DAYS_AGO(0),
        "subtotal": 1000000.0,
        "vat_amount": 200000.0,
        "total": 1200000.0,
        "paid_amount": 1200000.0,
        "status": "paid",
        "payment_method": "bank_transfer",
        "items": [
            {"name": "Внедрение CRM-системы", "quantity": 1, "unit": "услуга", "unit_price": 500000.0, "vat_rate": 20, "vat_amount": 100000.0, "total": 600000.0},
            {"name": "Интеграция с IP-телефонией", "quantity": 1, "unit": "услуга", "unit_price": 250000.0, "vat_rate": 20, "vat_amount": 50000.0, "total": 300000.0},
            {"name": "Интеграция с Email", "quantity": 1, "unit": "услуга", "unit_price": 100000.0, "vat_rate": 20, "vat_amount": 20000.0, "total": 120000.0},
            {"name": "Обучение персонала (5 чел.)", "quantity": 5, "unit": "чел.", "unit_price": 30000.0, "vat_rate": 20, "vat_amount": 30000.0, "total": 180000.0},
        ],
        "notes": "Оплата по безналичному расчёту, назначение: за услуги по договору №12/2026",
        "payments": [
            {"id": "pay10000-0001", "amount": 1200000.0, "payment_date": DAYS_AGO(2), "method": "bank_transfer", "reference": "Платёжное поручение №4382", "status": "confirmed"},
        ],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000002",
        "number": "INV-2026-0002",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "deal_id": "d1000000-0000-0000-0000-000000000001",
        "deal_name": "Разработка CRM-системы",
        "issue_date": DAYS_AGO(3),
        "due_date": DAYS_AHEAD(12),
        "subtotal": 416666.67,
        "vat_amount": 83333.33,
        "total": 500000.0,
        "paid_amount": 0.0,
        "status": "sent",
        "payment_method": "bank_transfer",
        "items": [
            {"name": "Внедрение CRM-системы (аванс 50%)", "quantity": 1, "unit": "услуга", "unit_price": 416666.67, "vat_rate": 20, "vat_amount": 83333.33, "total": 500000.0},
        ],
        "notes": "Аванс 50% по договору. Оставшаяся сумма — после сдачи проекта.",
        "payments": [],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000003",
        "number": "INV-2026-0003",
        "customer_id": "c1000000-0000-0000-0000-000000000005",
        "customer_name": "ООО «Гамма-Трейд»",
        "deal_id": "d1000000-0000-0000-0000-000000000004",
        "deal_name": "Поддержка серверов 24/7",
        "issue_date": DAYS_AGO(7),
        "due_date": DAYS_AGO(2),
        "subtotal": 416666.67,
        "vat_amount": 83333.33,
        "total": 500000.0,
        "paid_amount": 500000.0,
        "status": "paid",
        "payment_method": "bank_transfer",
        "items": [
            {"name": "Техническая поддержка 24/7 (годовой контракт)", "quantity": 12, "unit": "мес.", "unit_price": 34722.22, "vat_rate": 20, "vat_amount": 83333.33, "total": 500000.0},
        ],
        "notes": "Годовой контракт на техподдержку. Договор №45/2026.",
        "payments": [
            {"id": "pay10000-0003", "amount": 500000.0, "payment_date": DAYS_AGO(4), "method": "bank_transfer", "reference": "Платёжное поручение №1182", "status": "confirmed"},
        ],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000004",
        "number": "INV-2026-0004",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "customer_name": "ИП Петров А.В.",
        "deal_id": None,
        "deal_name": None,
        "issue_date": DAYS_AGO(10),
        "due_date": DAYS_AGO(3),
        "subtotal": 125000.0,
        "vat_amount": 25000.0,
        "total": 150000.0,
        "paid_amount": 0.0,
        "status": "overdue",
        "payment_method": "bank_transfer",
        "items": [
            {"name": "Установка модуля аналитики", "quantity": 1, "unit": "услуга", "unit_price": 125000.0, "vat_rate": 20, "vat_amount": 25000.0, "total": 150000.0},
        ],
        "notes": "Просрочена оплата. Отправлено напоминание клиенту.",
        "payments": [],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000005",
        "number": "INV-2026-0005",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "customer_name": "Анна Смирнова",
        "deal_id": "d1000000-0000-0000-0000-000000000005",
        "deal_name": "CRM для дизайн-студии",
        "issue_date": DAYS_AGO(2),
        "due_date": DAYS_AHEAD(13),
        "subtotal": 166666.67,
        "vat_amount": 33333.33,
        "total": 200000.0,
        "paid_amount": 80000.0,
        "status": "partially_paid",
        "payment_method": "card",
        "items": [
            {"name": "Базовый пакет CRM (годовая подписка)", "quantity": 1, "unit": "услуга", "unit_price": 166666.67, "vat_rate": 20, "vat_amount": 33333.33, "total": 200000.0},
        ],
        "notes": "Частичная оплата: аванс 80 000 ₽ картой, остаток 120 000 ₽ до 13 июля.",
        "payments": [
            {"id": "pay10000-0005a", "amount": 80000.0, "payment_date": DAYS_AGO(1), "method": "card", "reference": "СБП, txn_8834", "status": "confirmed"},
        ],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000006",
        "number": "INV-2026-0006",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_id": "d1000000-0000-0000-0000-000000000006",
        "deal_name": "Мобильное приложение для отдела продаж",
        "issue_date": DAYS_AGO(1),
        "due_date": DAYS_AHEAD(14),
        "subtotal": 666666.67,
        "vat_amount": 133333.33,
        "total": 800000.0,
        "paid_amount": 0.0,
        "status": "sent",
        "payment_method": "bank_transfer",
        "items": [
            {"name": "Разработка мобильного приложения (аванс 30%)", "quantity": 1, "unit": "услуга", "unit_price": 666666.67, "vat_rate": 20, "vat_amount": 133333.33, "total": 800000.0},
        ],
        "notes": "Аванс 30% по договору на разработку мобильного приложения.",
        "payments": [],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000007",
        "number": "INV-2026-0007",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "deal_id": None,
        "deal_name": None,
        "issue_date": DAYS_AGO(15),
        "due_date": DAYS_AGO(8),
        "subtotal": 250000.0,
        "vat_amount": 50000.0,
        "total": 300000.0,
        "paid_amount": 0.0,
        "status": "cancelled",
        "payment_method": None,
        "items": [
            {"name": "Консультация и аудит", "quantity": 1, "unit": "услуга", "unit_price": 250000.0, "vat_rate": 20, "vat_amount": 50000.0, "total": 300000.0},
        ],
        "notes": "Счёт отменён — клиент отказался от услуги.",
        "payments": [],
    },
    {
        "id": "inv10000-0000-0000-0000-000000000008",
        "number": "INV-2026-0008",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_id": None,
        "deal_name": None,
        "issue_date": DAYS_AGO(0),
        "due_date": DAYS_AHEAD(1),
        "subtotal": 33333.0,
        "vat_amount": 6667.0,
        "total": 40000.0,
        "paid_amount": 0.0,
        "status": "draft",
        "payment_method": None,
        "items": [
            {"name": "Дополнительная настройка системы", "quantity": 2, "unit": "час", "unit_price": 16666.5, "vat_rate": 20, "vat_amount": 6667.0, "total": 40000.0},
        ],
        "notes": "Черновик счёта, не отправлен клиенту.",
        "payments": [],
    },
]

# Historical payments for chart
MOCK_PAYMENTS_HISTORY = [
    {"month": "Янв", "amount": 2100000}, {"month": "Фев", "amount": 2400000},
    {"month": "Мар", "amount": 2800000}, {"month": "Апр", "amount": 2600000},
    {"month": "Май", "amount": 2900000}, {"month": "Июн", "amount": 1700000},
]


def _compute_stats():
    paid = sum(i["paid_amount"] for i in MOCK_INVOICES if i["status"] in ("paid", "partially_paid"))
    pending = sum(i["total"] - i["paid_amount"] for i in MOCK_INVOICES if i["status"] in ("sent", "partially_paid"))
    overdue = sum(i["total"] - i["paid_amount"] for i in MOCK_INVOICES if i["status"] == "overdue")
    total_month = sum(i["total"] for i in MOCK_INVOICES if i["status"] != "cancelled" and i["status"] != "draft")
    return {"paid": paid, "pending": pending, "overdue": overdue, "total_month": total_month}


@router.get("/dashboard")
async def finance_dashboard():
    """Financial dashboard summary."""
    stats = _compute_stats()
    return {
        **stats,
        "payments_chart": MOCK_PAYMENTS_HISTORY,
        "overdue_invoices": [i for i in MOCK_INVOICES if i["status"] == "overdue"],
    }


@router.get("/invoices")
async def list_invoices(
    status: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
):
    """List invoices."""
    items = MOCK_INVOICES
    if status:
        items = [i for i in items if i["status"] == status]
    if customer_id:
        items = [i for i in items if i["customer_id"] == customer_id]
    return {"data": items, "total": len(items)}


@router.get("/invoices/{invoice_id}")
async def get_invoice_detail(invoice_id: str):
    """Get invoice detail with items and payments."""
    for inv in MOCK_INVOICES:
        if inv["id"] == invoice_id:
            return inv
    return {"error": "Not found"}, 404


@router.post("/invoices/{invoice_id}/payments", status_code=201)
async def register_payment(invoice_id: str, payment: dict):
    """Register a payment against an invoice (mock — in-memory)."""
    for inv in MOCK_INVOICES:
        if inv["id"] == invoice_id:
            new_pay = {
                "id": f"pay_{uuid.uuid4().hex[:8]}",
                "amount": float(payment.get("amount", 0)),
                "payment_date": payment.get("payment_date", NOW.strftime("%Y-%m-%d")),
                "method": payment.get("method", "bank_transfer"),
                "reference": payment.get("reference", ""),
                "status": "confirmed",
            }
            inv["payments"].append(new_pay)
            inv["paid_amount"] += new_pay["amount"]
            if inv["paid_amount"] >= inv["total"]:
                inv["status"] = "paid"
            elif inv["paid_amount"] > 0:
                inv["status"] = "partially_paid"
            return {"invoice": inv, "payment": new_pay}
    return {"error": "Not found"}, 404


@router.post("/invoices", status_code=201)
async def create_invoice(invoice_data: dict):
    """Create a new invoice (mock)."""
    new_num = f"INV-2026-{len(MOCK_INVOICES) + 1:04d}"
    subtotal = float(invoice_data.get("amount", 0))
    vat = round(subtotal * 0.2, 2)
    total = subtotal + vat
    new_inv = {
        "id": f"inv_{uuid.uuid4().hex[:8]}",
        "number": new_num,
        "customer_id": invoice_data.get("customer_id"),
        "customer_name": invoice_data.get("customer_name", ""),
        "deal_id": None,
        "deal_name": None,
        "issue_date": NOW.strftime("%Y-%m-%d"),
        "due_date": invoice_data.get("due_date"),
        "subtotal": subtotal,
        "vat_amount": vat,
        "total": total,
        "paid_amount": 0.0,
        "status": "draft",
        "payment_method": None,
        "items": [{"name": invoice_data.get("description", "Услуга"), "quantity": 1, "unit": "услуга", "unit_price": subtotal, "vat_rate": 20, "vat_amount": vat, "total": total}],
        "notes": "",
        "payments": [],
    }
    MOCK_INVOICES.append(new_inv)
    return new_inv
