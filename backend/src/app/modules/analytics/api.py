"""
Analytics Module — API Router.
Dashboard metrics and reports.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/analytics")


@router.get("/dashboard")
async def dashboard(period: str = "month"):
    """
    Dashboard data: KPIs, funnel, recent leads, tasks.
    """
    return {
        "kpis": {
            "new_leads": 142,
            "active_deals": 24,
            "revenue_month": 4200000,
            "overdue_tasks": 3,
        },
        "funnel": [
            {"stage_name": "Новый", "count": 142, "amount": 0},
            {"stage_name": "Квалификация", "count": 95, "amount": 8500000},
            {"stage_name": "КП отправлено", "count": 58, "amount": 6200000},
            {"stage_name": "Переговоры", "count": 45, "amount": 5100000},
            {"stage_name": "Договор", "count": 40, "amount": 4600000},
            {"stage_name": "Выиграно", "count": 38, "amount": 4200000},
        ],
        "revenue_chart": [
            {"month": "Янв", "amount": 3100000},
            {"month": "Фев", "amount": 3500000},
            {"month": "Мар", "amount": 3800000},
            {"month": "Апр", "amount": 3600000},
            {"month": "Май", "amount": 3700000},
            {"month": "Июн", "amount": 4200000},
        ],
    }


@router.get("/funnel")
async def funnel_report(from_date: str = None, to_date: str = None):
    """Detailed funnel conversion report."""
    return {
        "stages": [
            {"name": "Новый лид", "count": 142, "conversion": 100.0},
            {"name": "Квалификация", "count": 95, "conversion": 66.9},
            {"name": "КП отправлено", "count": 58, "conversion": 61.1},
            {"name": "Переговоры", "count": 45, "conversion": 77.6},
            {"name": "Договор", "count": 40, "conversion": 88.9},
            {"name": "Выиграно", "count": 38, "conversion": 95.0},
        ],
        "overall_conversion": 26.8,
    }


@router.get("/managers")
async def managers_report():
    """Employee performance report."""
    return {
        "data": [
            {"manager": "Иван П.", "leads": 45, "deals": 18, "won": 12, "revenue": 1200000, "sla_rate": 92},
            {"manager": "Анна С.", "leads": 38, "deals": 15, "won": 10, "revenue": 980000, "sla_rate": 88},
            {"manager": "Игорь С.", "leads": 32, "deals": 12, "won": 8, "revenue": 750000, "sla_rate": 85},
        ]
    }


@router.get("/sources")
async def sources_report():
    """Lead sources ROI report."""
    return {
        "data": [
            {"source": "telegram", "leads": 57, "won": 15, "revenue": 1700000, "cpl": 500},
            {"source": "email", "leads": 36, "won": 10, "revenue": 1100000, "cpl": 200},
            {"source": "phone", "leads": 28, "won": 8, "revenue": 900000, "cpl": 0},
            {"source": "web_form", "leads": 21, "won": 5, "revenue": 500000, "cpl": 1200},
        ]
    }
