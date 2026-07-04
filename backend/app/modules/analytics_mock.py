"""
Mock API for Analytics: sales, funnel, employees, sources, conversion.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock/analytics", tags=["Mock Analytics"])

NOW = datetime.now(timezone.utc)


@router.get("/overview")
async def analytics_overview(period: str = Query("month", regex="^(week|month|quarter|year)$")):
    """High-level overview: KPIs + trends."""
    periods = {
        "week": {"label": "Неделя", "leads": 38, "deals": 12, "won": 5, "revenue": 980000, "prev_revenue": 750000},
        "month": {"label": "Месяц", "leads": 142, "deals": 49, "won": 38, "revenue": 4200000, "prev_revenue": 3700000},
        "quarter": {"label": "Квартал", "leads": 412, "deals": 138, "won": 95, "revenue": 12100000, "prev_revenue": 10900000},
        "year": {"label": "Год", "leads": 1620, "deals": 520, "won": 380, "revenue": 48000000, "prev_revenue": 41000000},
    }
    p = periods[period]
    growth = ((p["revenue"] - p["prev_revenue"]) / p["prev_revenue"] * 100) if p["prev_revenue"] else 0

    return {
        "period": p["label"],
        "kpis": {
            "leads": p["leads"],
            "deals_created": p["deals"],
            "deals_won": p["won"],
            "revenue": p["revenue"],
            "avg_deal": p["revenue"] // max(p["won"], 1),
            "conversion_lead_deal": round(p["deals"] / max(p["leads"], 1) * 100, 1),
            "conversion_deal_won": round(p["won"] / max(p["deals"], 1) * 100, 1),
            "growth_pct": round(growth, 1),
        },
    }


@router.get("/funnel")
async def analytics_funnel(period: str = Query("month")):
    """Detailed funnel with conversion rates."""
    stages = [
        {"stage": "Новый лид", "count": 142, "amount": 0, "conv_to_next": 66.9, "conv_from_start": 100.0},
        {"stage": "Квалификация", "count": 95, "amount": 8500000, "conv_to_next": 61.1, "conv_from_start": 66.9},
        {"stage": "Встреча / Презентация", "count": 72, "amount": 7200000, "conv_to_next": 80.6, "conv_from_start": 50.7},
        {"stage": "КП отправлено", "count": 58, "amount": 6200000, "conv_to_next": 77.6, "conv_from_start": 40.8},
        {"stage": "Переговоры", "count": 45, "amount": 5100000, "conv_to_next": 88.9, "conv_from_start": 31.7},
        {"stage": "Договор", "count": 40, "amount": 4600000, "conv_to_next": 95.0, "conv_from_start": 28.2},
        {"stage": "Оплата", "count": 38, "amount": 4200000, "conv_to_next": 100.0, "conv_from_start": 26.8},
    ]
    return {
        "stages": stages,
        "overall_conversion": 26.8,
        "avg_cycle_days": 21,
        "lost_count": 104,
        "lost_reasons": [
            {"reason": "Цена выше рынка", "count": 32, "pct": 30.8},
            {"reason": "Выбрали конкурента", "count": 28, "pct": 26.9},
            {"reason": "Нет бюджета", "count": 21, "pct": 20.2},
            {"reason": "Нет решения", "count": 14, "pct": 13.5},
            {"reason": "Перестал отвечать", "count": 9, "pct": 8.6},
        ],
    }


@router.get("/managers")
async def analytics_managers(period: str = Query("month")):
    """Employee performance report."""
    return {
        "data": [
            {"name": "Иван Петров", "avatar": None, "leads": 45, "deals_created": 18, "deals_won": 12, "conversion": 26.7, "revenue": 1200000, "avg_deal": 100000, "sla_rate": 92, "tasks_done": 48, "tasks_overdue": 3},
            {"name": "Анна Смирнова", "avatar": None, "leads": 38, "deals_created": 15, "deals_won": 10, "conversion": 26.3, "revenue": 980000, "avg_deal": 98000, "sla_rate": 88, "tasks_done": 42, "tasks_overdue": 2},
            {"name": "Игорь Сидоров", "avatar": None, "leads": 32, "deals_created": 12, "deals_won": 9, "conversion": 28.1, "revenue": 1450000, "avg_deal": 161000, "sla_rate": 85, "tasks_done": 38, "tasks_overdue": 1},
            {"name": "Ольга Кузнецова", "avatar": None, "leads": 28, "deals_created": 10, "deals_won": 7, "conversion": 25.0, "revenue": 620000, "avg_deal": 89000, "sla_rate": 79, "tasks_done": 35, "tasks_overdue": 4},
            {"name": "Пётр Иванов", "avatar": None, "leads": 20, "deals_created": 8, "deals_won": 5, "conversion": 25.0, "revenue": 450000, "avg_deal": 90000, "sla_rate": 95, "tasks_done": 22, "tasks_overdue": 0},
        ],
        "totals": {
            "leads": 163, "deals_created": 63, "deals_won": 43,
            "revenue": 4700000, "avg_sla": 87.8,
        },
    }


@router.get("/sources")
async def analytics_sources(period: str = Query("month")):
    """Lead sources ROI report."""
    return {
        "data": [
            {"source": "telegram", "icon": "💬", "leads": 57, "deals": 20, "won": 15, "conversion": 26.3, "revenue": 1700000, "cost": 28500, "cpl": 500, "roi": 5871},
            {"source": "email", "icon": "✉️", "leads": 36, "deals": 12, "won": 10, "conversion": 27.8, "revenue": 1100000, "cost": 7200, "cpl": 200, "roi": 15178},
            {"source": "phone", "icon": "📞", "leads": 28, "deals": 10, "won": 8, "conversion": 28.6, "revenue": 900000, "cost": 0, "cpl": 0, "roi": 999999},
            {"source": "web_form", "icon": "🌐", "leads": 21, "deals": 7, "won": 5, "conversion": 23.8, "revenue": 500000, "cost": 25200, "cpl": 1200, "roi": 1884},
            {"source": "referral", "icon": "🤝", "leads": 15, "deals": 5, "won": 4, "conversion": 26.7, "revenue": 420000, "cost": 0, "cpl": 0, "roi": 999999},
        ],
        "totals": {"leads": 157, "deals": 54, "won": 42, "revenue": 4620000, "cost": 60900},
    }


@router.get("/revenue-chart")
async def revenue_chart(period: str = Query("month")):
    """Revenue dynamics over time."""
    months = [
        {"label": "Янв", "revenue": 3100000, "leads": 108, "deals": 38},
        {"label": "Фев", "revenue": 3500000, "leads": 121, "deals": 42},
        {"label": "Мар", "revenue": 3800000, "leads": 135, "deals": 46},
        {"label": "Апр", "revenue": 3600000, "leads": 128, "deals": 44},
        {"label": "Май", "revenue": 3700000, "leads": 130, "deals": 45},
        {"label": "Июн", "revenue": 4200000, "leads": 142, "deals": 49},
    ]
    return {"data": months, "total": sum(m["revenue"] for m in months), "avg": sum(m["revenue"] for m in months) // len(months)}


@router.get("/activity-heatmap")
async def activity_heatmap():
    """Hour/day activity heatmap data."""
    days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    hours = list(range(9, 21))  # 9:00 - 20:00
    import random
    random.seed(42)
    grid = []
    for di, day in enumerate(days):
        row = []
        for hi, hour in enumerate(hours):
            # Higher activity during business hours
            base = 10 if di < 5 else 2
            if 10 <= hour <= 18:
                base += 15
            if hour == 14:
                base += 10
            row.append(base + random.randint(0, 8))
        grid.append({"day": day, "values": row})
    return {"hours": [f"{h}:00" for h in hours], "days": days, "grid": grid}
