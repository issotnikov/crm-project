"""
Mock data for tasks and calendar events.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock/tasks", tags=["Mock Tasks"])

NOW = datetime.now(timezone.utc)
H = lambda h: (NOW + timedelta(hours=h)).isoformat()
H_AGO = lambda h: (NOW - timedelta(hours=h)).isoformat()

MOCK_TASKS = [
    {
        "id": "tk100000-0000-0000-0000-000000000001",
        "title": "Позвонить Ивану Иванову (Ромашка)",
        "description": "Обсудить детали CRM-внедрения, подтвердить встречу на следующую неделю. Подготовить ответ на вопрос про интеграцию с 1С.",
        "status": "pending",
        "priority": "urgent",
        "type": "call",
        "assignee_name": "Иван Петров",
        "created_by_name": "Иван Петров",
        "due_date": H(1),
        "remind_at": H(0.5),
        "completed_at": None,
        "customer_name": "ООО «Ромашка»",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "deal_name": "Разработка CRM-системы",
        "deal_id": "d1000000-0000-0000-0000-000000000001",
        "lead_name": None,
        "lead_id": None,
        "checklist": [
            {"id": "cl1", "text": "Подготовить список вопросов", "done": True},
            {"id": "cl2", "text": "Проверить статус КП", "done": True},
            {"id": "cl3", "text": "Обсудить интеграцию с 1С", "done": False},
            {"id": "cl4", "text": "Согласовать встречу", "done": False},
        ],
        "comments": [
            {"id": "cm1", "author": "Иван Петров", "body": "Клиент готов к разговору, звоним в 11:00", "created_at": H_AGO(2)},
        ],
        "created_at": H_AGO(5),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000002",
        "title": "Подготовить договор для Ромашки",
        "description": "Подготовить проект договора на внедрение CRM. Использовать шаблон 'Договор оказания услуг'.",
        "status": "pending",
        "priority": "urgent",
        "type": "document",
        "assignee_name": "Иван Петров",
        "created_by_name": "Иван Петров",
        "due_date": H_AGO(2),
        "remind_at": H_AGO(3),
        "completed_at": None,
        "customer_name": "ООО «Ромашка»",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "deal_name": "Разработка CRM-системы",
        "deal_id": "d1000000-0000-0000-0000-000000000001",
        "lead_name": None,
        "lead_id": None,
        "checklist": [
            {"id": "cl5", "text": "Скачать шаблон договора", "done": True},
            {"id": "cl6", "text": "Заполнить реквизиты клиента", "done": False},
            {"id": "cl7", "text": "Согласовать с юристом", "done": False},
        ],
        "comments": [],
        "created_at": H_AGO(26),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000003",
        "title": "Follow-up: отправить КП Петрову",
        "description": "Отправить КП на базовый пакет CRM. Перезвонить через 2 дня после отправки.",
        "status": "pending",
        "priority": "high",
        "type": "email",
        "assignee_name": "Анна Смирнова",
        "created_by_name": "Анна Смирнова",
        "due_date": H(3),
        "remind_at": H(2),
        "completed_at": None,
        "customer_name": "ИП Петров А.В.",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "deal_name": None,
        "deal_id": None,
        "lead_name": "Запрос КП",
        "lead_id": "l1000000-0000-0000-0000-000000000002",
        "checklist": [
            {"id": "cl8", "text": "Подготовить КП из шаблона", "done": True},
            {"id": "cl9", "text": "Отправить на email", "done": False},
        ],
        "comments": [],
        "created_at": H_AGO(4),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000004",
        "title": "Встреча с ТехноЛогик — демо платформы",
        "description": "Провести демонстрацию CRM-системы для руководства ТехноЛогик. Участники: С. Морозов, Д. Орлов. Подготовить презентацию.",
        "status": "pending",
        "priority": "high",
        "type": "meeting",
        "assignee_name": "Игорь Сидоров",
        "created_by_name": "Игорь Сидоров",
        "due_date": H(5),
        "remind_at": H(4),
        "completed_at": None,
        "customer_name": "ООО «ТехноЛогик»",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "deal_name": "Комплексная автоматизация",
        "deal_id": "d1000000-0000-0000-0000-000000000002",
        "lead_name": None,
        "lead_id": None,
        "checklist": [
            {"id": "cl10", "text": "Подготовить демо-стенд", "done": False},
            {"id": "cl11", "text": "Отправить ссылку участникам", "done": False},
            {"id": "cl12", "text": "Подготовить презентацию", "done": False},
        ],
        "comments": [
            {"id": "cm2", "author": "Игорь Сидоров", "body": "Встреча перенесена на 16:00", "created_at": H_AGO(1)},
        ],
        "created_at": H_AGO(8),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000005",
        "title": "Follow-up звонок — ТехноЛогик (КП)",
        "description": "Перезвонить через 2 дня после отправки КП. Узнать решение.",
        "status": "pending",
        "priority": "medium",
        "type": "call",
        "assignee_name": "Игорь Сидоров",
        "created_by_name": "Игорь Сидоров",
        "due_date": H(48),
        "remind_at": H(47),
        "completed_at": None,
        "customer_name": "ООО «ТехноЛогик»",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "deal_name": "Комплексная автоматизация",
        "deal_id": "d1000000-0000-0000-0000-000000000002",
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": H_AGO(6),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000006",
        "title": "Отправить счёт Гамма-Трейд",
        "description": "Выставить счёт по подписанному договору.",
        "status": "done",
        "priority": "medium",
        "type": "document",
        "assignee_name": "Игорь Сидоров",
        "created_by_name": "Игорь Сидоров",
        "due_date": H_AGO(5),
        "remind_at": None,
        "completed_at": H_AGO(4),
        "customer_name": "ООО «Гамма-Трейд»",
        "customer_id": "c1000000-0000-0000-0000-000000000005",
        "deal_name": "Поддержка серверов 24/7",
        "deal_id": "d1000000-0000-0000-0000-000000000004",
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": H_AGO(8),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000007",
        "title": "Встреча с Д. Орловым (ТехноЛогик)",
        "description": "Обсудить макеты мобильного приложения.",
        "status": "pending",
        "priority": "high",
        "type": "meeting",
        "assignee_name": "Игорь Сидоров",
        "created_by_name": "Игорь Сидоров",
        "due_date": H(2),
        "remind_at": H(1.5),
        "completed_at": None,
        "customer_name": "ООО «ТехноЛогик»",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "deal_name": "Мобильное приложение",
        "deal_id": "d1000000-0000-0000-0000-000000000006",
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": H_AGO(3),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000008",
        "title": "Обновить прайс-лист",
        "description": "Актуализировать цены на услуги перед новым кварталом.",
        "status": "pending",
        "priority": "low",
        "type": "custom",
        "assignee_name": "Иван Петров",
        "created_by_name": "Иван Петров",
        "due_date": None,
        "remind_at": None,
        "completed_at": None,
        "customer_name": None,
        "customer_id": None,
        "deal_name": None,
        "deal_id": None,
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": H_AGO(48),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000009",
        "title": "Согласовать бюджет с руководством",
        "description": "Согласовать бюджет на Q3 по отделу продаж.",
        "status": "pending",
        "priority": "medium",
        "type": "custom",
        "assignee_name": "Иван Петров",
        "created_by_name": "Администратор Системный",
        "due_date": H(72),
        "remind_at": H(70),
        "completed_at": None,
        "customer_name": None,
        "customer_id": None,
        "deal_name": None,
        "deal_id": None,
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": H_AGO(12),
    },
    {
        "id": "tk100000-0000-0000-0000-000000000010",
        "title": "Отправить КП Смирновой (дизайн-студия)",
        "description": "Подготовить и отправить КП на базовый пакет для дизайн-студии.",
        "status": "done",
        "priority": "medium",
        "type": "document",
        "assignee_name": "Иван Петров",
        "created_by_name": "Иван Петров",
        "due_date": H_AGO(10),
        "remind_at": None,
        "completed_at": H_AGO(9),
        "customer_name": "Анна Смирнова",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "deal_name": "CRM для дизайн-студии",
        "deal_id": "d1000000-0000-0000-0000-000000000005",
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": H_AGO(12),
    },
]

# Calendar events derived from tasks + standalone events
MOCK_EVENTS = []

def _generate_events():
    global MOCK_EVENTS
    MOCK_EVENTS = []
    today = NOW.date()

    # Generate events from tasks with due_date
    for t in MOCK_TASKS:
        if t["due_date"] and t["type"] in ("meeting", "call"):
            dt = datetime.fromisoformat(t["due_date"].replace("Z", "+00:00"))
            MOCK_EVENTS.append({
                "id": f"evt_{t['id']}",
                "title": t["title"],
                "description": t.get("description", ""),
                "type": t["type"],
                "start_at": t["due_date"],
                "end_at": (dt + timedelta(hours=1)).isoformat(),
                "all_day": False,
                "location": t["type"] == "meeting" and "Zoom / Google Meet" or None,
                "organizer_name": t["assignee_name"],
                "customer_name": t.get("customer_name"),
                "deal_name": t.get("deal_name"),
                "task_id": t["id"],
                "status": "scheduled",
            })

    # Add some standalone events
    MOCK_EVENTS.extend([
        {
            "id": "evt_standalone_1",
            "title": "Еженедельный планёрка отдела продаж",
            "description": "Статус по сделкам, планы на неделю",
            "type": "meeting",
            "start_at": NOW.replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
            "end_at": NOW.replace(hour=10, minute=30, second=0, microsecond=0).isoformat(),
            "all_day": False,
            "location": "Переговорная №1",
            "organizer_name": "Администратор Системный",
            "customer_name": None,
            "deal_name": None,
            "task_id": None,
            "status": "scheduled",
        },
        {
            "id": "evt_standalone_2",
            "title": "Демо CRM для нового клиента",
            "description": "Презентация системы для ООО «Мечта»",
            "type": "demo",
            "start_at": (NOW + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0).isoformat(),
            "end_at": (NOW + timedelta(days=1)).replace(hour=15, minute=0, second=0, microsecond=0).isoformat(),
            "all_day": False,
            "location": "Zoom",
            "organizer_name": "Анна Смирнова",
            "customer_name": "ООО «Мечта»",
            "deal_name": None,
            "task_id": None,
            "status": "scheduled",
        },
        {
            "id": "evt_standalone_3",
            "title": "Обучение клиентов работе с CRM",
            "description": "Групповое обучение для новых пользователей",
            "type": "meeting",
            "start_at": (NOW + timedelta(days=2)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat(),
            "end_at": (NOW + timedelta(days=2)).replace(hour=12, minute=30, second=0, microsecond=0).isoformat(),
            "all_day": False,
            "location": "Zoom",
            "organizer_name": "Игорь Сидоров",
            "customer_name": None,
            "deal_name": None,
            "task_id": None,
            "status": "scheduled",
        },
        {
            "id": "evt_standalone_4",
            "title": "День рождения: Анна Смирнова 🎂",
            "description": "Не забыть поздравить!",
            "type": "reminder",
            "start_at": (NOW + timedelta(days=3)).replace(hour=9, minute=0, second=0, microsecond=0).isoformat(),
            "end_at": (NOW + timedelta(days=3)).replace(hour=9, minute=15, second=0, microsecond=0).isoformat(),
            "all_day": True,
            "location": None,
            "organizer_name": None,
            "customer_name": None,
            "deal_name": None,
            "task_id": None,
            "status": "scheduled",
        },
    ])

_generate_events()


@router.get("/")
async def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    overdue: Optional[bool] = Query(None),
):
    """List tasks with optional filters."""
    items = MOCK_TASKS
    if status:
        items = [t for t in items if t["status"] == status]
    if priority:
        items = [t for t in items if t["priority"] == priority]
    if overdue:
        items = [t for t in items if t["due_date"] and t["status"] != "done" and t["due_date"] < NOW.isoformat()]
    return {"data": items, "total": len(items)}


@router.get("/reminders")
async def get_reminders():
    """Get tasks that need reminders (due soon or overdue)."""
    reminders = []
    for t in MOCK_TASKS:
        if t["status"] == "done":
            continue
        if not t["due_date"]:
            continue
        due = datetime.fromisoformat(t["due_date"].replace("Z", "+00:00"))
        diff_hours = (due - NOW).total_seconds() / 3600

        if diff_hours < 0:
            reminders.append({**t, "reminder_type": "overdue"})
        elif diff_hours < 4:
            reminders.append({**t, "reminder_type": "soon"})
    return {"data": reminders, "total": len(reminders)}


@router.get("/{task_id}")
async def get_task_detail(task_id: str):
    """Get task detail."""
    for t in MOCK_TASKS:
        if t["id"] == task_id:
            return t
    return {"error": "Not found"}, 404


@router.post("/", status_code=201)
async def create_task(task: dict):
    """Create a new task (mock — returns created task)."""
    new_id = f"tk{uuid.uuid4()}"
    new_task = {
        "id": new_id,
        "title": task.get("title", ""),
        "description": task.get("description", ""),
        "status": "pending",
        "priority": task.get("priority", "medium"),
        "type": task.get("type", "custom"),
        "assignee_name": "Иван Петров",
        "created_by_name": "Иван Петров",
        "due_date": task.get("due_date"),
        "remind_at": task.get("remind_at"),
        "completed_at": None,
        "customer_name": task.get("customer_name"),
        "customer_id": None,
        "deal_name": task.get("deal_name"),
        "deal_id": None,
        "lead_name": None,
        "lead_id": None,
        "checklist": [],
        "comments": [],
        "created_at": NOW.isoformat(),
    }
    MOCK_TASKS.append(new_task)
    return new_task


@router.patch("/{task_id}")
async def update_task(task_id: str, update: dict):
    """Update a task."""
    for t in MOCK_TASKS:
        if t["id"] == task_id:
            for k, v in update.items():
                if k == "status" and v == "done":
                    t["completed_at"] = NOW.isoformat()
                t[k] = v
            return t
    return {"error": "Not found"}, 404


# ── Calendar events ─────────────────────────────────────────────

@router.get("/calendar/events")
async def list_calendar_events(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    """List calendar events in a date range."""
    items = MOCK_EVENTS
    if start:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        items = [e for e in items if datetime.fromisoformat(e["start_at"].replace("Z", "+00:00")) >= start_dt]
    if end:
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
        items = [e for e in items if datetime.fromisoformat(e["start_at"].replace("Z", "+00:00")) <= end_dt]
    return {"data": items, "total": len(items)}


@router.post("/calendar/events", status_code=201)
async def create_calendar_event(event: dict):
    """Create a calendar event (mock)."""
    new_id = f"evt_{uuid.uuid4()}"
    new_event = {
        "id": new_id,
        "title": event.get("title", ""),
        "description": event.get("description", ""),
        "type": event.get("type", "meeting"),
        "start_at": event.get("start_at"),
        "end_at": event.get("end_at"),
        "all_day": event.get("all_day", False),
        "location": event.get("location"),
        "organizer_name": "Иван Петров",
        "customer_name": None,
        "deal_name": None,
        "task_id": None,
        "status": "scheduled",
    }
    MOCK_EVENTS.append(new_event)
    return new_event
