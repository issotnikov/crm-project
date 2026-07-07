"""
Mock data API endpoints.
Returns demo customers, leads, deals with full detail (contacts, interactions).
Used when database is empty / in development.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock", tags=["Mock Data"])

# ── Mock Data ────────────────────────────────────────────────────

NOW = datetime.utcnow()
HOURS_AGO = lambda h: (NOW - timedelta(hours=h)).isoformat() + "Z"
DAYS_AGO = lambda d: (NOW - timedelta(days=d)).isoformat() + "Z"

MOCK_CUSTOMERS = [
    {
        "id": "c1000000-0000-0000-0000-000000000001",
        "type": "company",
        "name": "ООО «Ромашка»",
        "full_legal_name": "Общество с ограниченной ответственностью «Ромашка»",
        "inn": "7701234567",
        "industry": "IT / Разработка ПО",
        "website": "romashka.ru",
        "status": "active",
        "source": "telegram",
        "responsible_manager_id": "a0000000-0000-0000-0000-000000000002",
        "responsible_manager_name": "Иван Петров",
        "tags": ["B2B", "IT"],
        "total_revenue": 1200000,
        "deals_count": 3,
        "created_at": DAYS_AGO(45),
        "contacts": [
            {
                "id": "ct100000-0000-0000-0000-000000000001",
                "first_name": "Иван",
                "last_name": "Иванов",
                "position": "Генеральный директор",
                "phone": "+7 (495) 123-45-67",
                "email": "i.ivanov@romashka.ru",
                "telegram": "@ivanov_ceo", "max_messenger": "ivanov.max",
                "is_primary": True,
            },
            {
                "id": "ct100000-0000-0000-0000-000000000002",
                "first_name": "Анна",
                "last_name": "Петрова",
                "position": "Коммерческий директор",
                "phone": "+7 (495) 765-43-21",
                "email": "a.petrova@romashka.ru",
                "telegram": None,
                "is_primary": False,
            },
        ],
        "interactions": [
            {"id": "i1", "type": "message", "channel": "telegram", "direction": "inbound", "subject": None, "body": "Здравствуйте! Нам нужна CRM система для отдела продаж", "created_at": HOURS_AGO(3), "created_by_name": None},
            {"id": "i2", "type": "message", "channel": "telegram", "direction": "outbound", "subject": None, "body": "Добрый день! Спасибо за обращение. Расскажите подробнее о ваших задачах?", "created_at": HOURS_AGO(2), "created_by_name": "Иван Петров"},
            {"id": "i3", "type": "call", "channel": "phone", "direction": "inbound", "subject": "Входящий звонок", "body": "Длительность: 4:32 мин. Обсуждали функционал и стоимость.", "duration": 272, "recording_url": None, "created_at": HOURS_AGO(1), "created_by_name": None},
            {"id": "i4", "type": "note", "channel": "internal", "direction": None, "subject": "Заметка менеджера", "body": "Клиент готов к КП. Бюджет ~500K. Срочность высокая.", "created_at": HOURS_AGO(1), "created_by_name": "Иван Петров"},
        ],
    },
    {
        "id": "c1000000-0000-0000-0000-000000000002",
        "type": "individual",
        "name": "ИП Петров А.В.",
        "full_legal_name": "Петров Алексей Васильевич (ИП)",
        "inn": "780123456789",
        "industry": "Розничная торговля",
        "website": None,
        "status": "active",
        "source": "email",
        "responsible_manager_id": "a0000000-0000-0000-0000-000000000003",
        "responsible_manager_name": "Анна Смирнова",
        "tags": ["B2B", "Ритейл"],
        "total_revenue": 350000,
        "deals_count": 2,
        "created_at": DAYS_AGO(30),
        "contacts": [
            {
                "id": "ct100000-0000-0000-0000-000000000003",
                "first_name": "Алексей",
                "last_name": "Петров",
                "position": "Индивидуальный предприниматель",
                "phone": "+7 (916) 555-12-34",
                "email": "petrov.av@mail.ru",
                "telegram": "@alexey_petrov", "max_messenger": "petrov.max",
                "is_primary": True,
            },
        ],
        "interactions": [
            {"id": "i5", "type": "email", "channel": "email", "direction": "inbound", "subject": "Запрос коммерческого предложения", "body": "Добрый день! Прошу выслать КП на внедрение CRM.", "created_at": HOURS_AGO(5), "created_by_name": None},
        ],
    },
    {
        "id": "c1000000-0000-0000-0000-000000000003",
        "type": "company",
        "name": "ООО «ТехноЛогик»",
        "full_legal_name": "Общество с ограниченной ответственностью «ТехноЛогик»",
        "inn": "7707654321",
        "industry": "Логистика / Транспорт",
        "website": "technologic.ru",
        "status": "vip",
        "source": "phone",
        "responsible_manager_id": "a0000000-0000-0000-0000-000000000004",
        "responsible_manager_name": "Игорь Сидоров",
        "tags": ["VIP", "B2B", "Логистика"],
        "total_revenue": 2400000,
        "deals_count": 5,
        "created_at": DAYS_AGO(120),
        "contacts": [
            {
                "id": "ct100000-0000-0000-0000-000000000004",
                "first_name": "Сергей",
                "last_name": "Морозов",
                "position": "IT-директор",
                "phone": "+7 (495) 333-22-11",
                "email": "s.morozov@technologic.ru",
                "telegram": "@smorozov_it", "max_messenger": "morozov.max",
                "is_primary": True,
            },
            {
                "id": "ct100000-0000-0000-0000-000000000005",
                "first_name": "Марина",
                "last_name": "Волкова",
                "position": "Финансовый директор",
                "phone": "+7 (495) 333-22-12",
                "email": "m.volkova@technologic.ru",
                "telegram": None,
                "is_primary": False,
            },
            {
                "id": "ct100000-0000-0000-0000-000000000006",
                "first_name": "Дмитрий",
                "last_name": "Орлов",
                "position": "Руководитель отдела продаж",
                "phone": "+7 (495) 333-22-13",
                "email": "d.orlov@technologic.ru",
                "telegram": "@orlov_sales", "max_messenger": "orlov.max",
                "is_primary": False,
            },
        ],
        "interactions": [
            {"id": "i6", "type": "call", "channel": "phone", "direction": "outbound", "subject": "Исходящий звонок", "body": "Обсуждали этапы интеграции. Длительность: 12:15.", "duration": 735, "recording_url": None, "created_at": DAYS_AGO(2), "created_by_name": "Игорь Сидоров"},
            {"id": "i7", "type": "email", "channel": "email", "direction": "outbound", "subject": "КП отправлено", "body": "Отправлено коммерческое предложение v2 на сумму 1.2M ₽", "created_at": DAYS_AGO(1), "created_by_name": "Игорь Сидоров"},
            {"id": "i8", "type": "meeting", "channel": "internal", "direction": None, "subject": "Встреча-презентация", "body": "Провели демо системы. Участвовали: С.Морозов, Д.Орлов. Длительность: 1.5 часа.", "duration": 5400, "created_at": DAYS_AGO(3), "created_by_name": "Игорь Сидоров"},
        ],
    },
    {
        "id": "c1000000-0000-0000-0000-000000000004",
        "type": "individual",
        "name": "Анна Смирнова",
        "full_legal_name": "Смирнова Анна Сергеевна",
        "inn": None,
        "industry": "Дизайн / Маркетинг",
        "website": "anna-design.ru",
        "status": "active",
        "source": "web_form",
        "responsible_manager_id": "a0000000-0000-0000-0000-000000000002",
        "responsible_manager_name": "Иван Петров",
        "tags": ["B2C"],
        "total_revenue": 0,
        "deals_count": 0,
        "created_at": DAYS_AGO(5),
        "contacts": [
            {
                "id": "ct100000-0000-0000-0000-000000000007",
                "first_name": "Анна",
                "last_name": "Смирнова",
                "position": None,
                "phone": "+7 (921) 444-55-66",
                "email": "anna@anna-design.ru",
                "telegram": "@anna_design", "max_messenger": "anna.max",
                "is_primary": True,
            },
        ],
        "interactions": [
            {"id": "i9", "type": "message", "channel": "web_form", "direction": "inbound", "subject": "Заявка с сайта", "body": "Здравствуйте! Заинтересовала ваша CRM. Хочу узнать подробнее.", "created_at": HOURS_AGO(8), "created_by_name": None},
        ],
    },
    {
        "id": "c1000000-0000-0000-0000-000000000005",
        "type": "company",
        "name": "ООО «Гамма-Трейд»",
        "full_legal_name": "Общество с ограниченной ответственностью «Гамма-Трейд»",
        "inn": "780567890123",
        "industry": "Оптовая торговля",
        "website": "gamma-trade.ru",
        "status": "active",
        "source": "referral",
        "responsible_manager_id": "a0000000-0000-0000-0000-000000000004",
        "responsible_manager_name": "Игорь Сидоров",
        "tags": ["B2B", "Постоянный клиент"],
        "total_revenue": 650000,
        "deals_count": 1,
        "created_at": DAYS_AGO(60),
        "contacts": [
            {
                "id": "ct100000-0000-0000-0000-000000000008",
                "first_name": "Виктор",
                "last_name": "Беляев",
                "position": "Генеральный директор",
                "phone": "+7 (812) 555-11-22",
                "email": "v.belyaev@gamma-trade.ru",
                "telegram": "@belyaev_gamma", "max_messenger": "belyaev.max",
                "is_primary": True,
            },
        ],
        "interactions": [
            {"id": "i10", "type": "note", "channel": "internal", "direction": None, "subject": "Сделка закрыта", "body": "✅ Договор подписан. Оплата получена. Переходим к проекту.", "created_at": DAYS_AGO(1), "created_by_name": "Игорь Сидоров"},
        ],
    },
]

MOCK_LEADS = [
    {
        "id": "l1000000-0000-0000-0000-000000000001",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "title": "Нужна CRM система для отдела продаж",
        "description": "Клиент обратился через Telegram. Нужна полноценная CRM для 15 менеджеров с интеграцией телефонии и почты. Бюджет ~500K ₽.",
        "source": "telegram",
        "status": "new",
        "priority": "urgent",
        "assigned_to": "a0000000-0000-0000-0000-000000000002",
        "assigned_to_name": "Иван Петров",
        "score": 85,
        "created_at": HOURS_AGO(3),
        "responded_at": None,
        "sla_deadline": HOURS_AGO(-1),  # 1 hour from now
        "contacts": [{"name": "Иван Иванов", "phone": "+7 (495) 123-45-67", "email": "i.ivanov@romashka.ru", "telegram": "@ivanov_ceo", "max_messenger": "ivanov.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000002",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "customer_name": "ИП Петров А.В.",
        "title": "Запрос коммерческого предложения",
        "description": "Просит выслать КП на внедрение CRM. Интересует базовый пакет.",
        "source": "email",
        "status": "new",
        "priority": "high",
        "assigned_to": "a0000000-0000-0000-0000-000000000003",
        "assigned_to_name": "Анна Смирнова",
        "score": 72,
        "created_at": HOURS_AGO(5),
        "responded_at": None,
        "sla_deadline": HOURS_AGO(-3),
        "contacts": [{"name": "Алексей Петров", "phone": "+7 (916) 555-12-34", "email": "petrov.av@mail.ru", "telegram": "@alexey_petrov", "max_messenger": "petrov.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000003",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "title": "Интеграция с IP-телефонией и Email",
        "description": "Существующий клиент. Нужна дополнительная интеграция телефонии Mango Office и подключение общих email-ящиков.",
        "source": "phone",
        "status": "in_progress",
        "priority": "medium",
        "assigned_to": "a0000000-0000-0000-0000-000000000004",
        "assigned_to_name": "Игорь Сидоров",
        "score": 65,
        "created_at": DAYS_AGO(2),
        "responded_at": DAYS_AGO(2),
        "sla_deadline": None,
        "contacts": [{"name": "Сергей Морозов", "phone": "+7 (495) 333-22-11", "email": "s.morozov@technologic.ru", "telegram": "@smorozov_it", "max_messenger": "morozov.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000004",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "customer_name": "Анна Смирнова",
        "title": "Заявка с формы обратной связи",
        "description": "Заинтересовалась CRM системой для дизайн-студии. Хочет демо.",
        "source": "web_form",
        "status": "in_progress",
        "priority": "medium",
        "assigned_to": "a0000000-0000-0000-0000-000000000002",
        "assigned_to_name": "Иван Петров",
        "score": 58,
        "created_at": HOURS_AGO(8),
        "responded_at": HOURS_AGO(6),
        "sla_deadline": None,
        "contacts": [{"name": "Анна Смирнова", "phone": "+7 (921) 444-55-66", "email": "anna@anna-design.ru", "telegram": "@anna_design", "max_messenger": "anna.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000005",
        "customer_id": "c1000000-0000-0000-0000-000000000005",
        "customer_name": "ООО «Гамма-Трейд»",
        "title": "Поддержка и обновление CRM",
        "description": "Запрос на продление техподдержки и обновление системы.",
        "source": "referral",
        "status": "qualified",
        "priority": "low",
        "assigned_to": "a0000000-0000-0000-0000-000000000004",
        "assigned_to_name": "Игорь Сидоров",
        "score": 45,
        "created_at": DAYS_AGO(4),
        "responded_at": DAYS_AGO(3),
        "sla_deadline": None,
        "contacts": [{"name": "Виктор Беляев", "phone": "+7 (812) 555-11-22", "email": "v.belyaev@gamma-trade.ru", "telegram": "@belyaev_gamma", "max_messenger": "belyaev.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000006",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "title": "Демо платформы для руководства",
        "description": "Квалифицированный лид. Назначена встреча-демонстрация.",
        "source": "email",
        "status": "qualified",
        "priority": "high",
        "assigned_to": "a0000000-0000-0000-0000-000000000004",
        "assigned_to_name": "Игорь Сидоров",
        "score": 78,
        "created_at": DAYS_AGO(5),
        "responded_at": DAYS_AGO(5),
        "sla_deadline": None,
        "contacts": [{"name": "Дмитрий Орлов", "phone": "+7 (495) 333-22-13", "email": "d.orlov@technologic.ru", "telegram": "@orlov_sales", "max_messenger": "orlov.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000007",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "customer_name": "ИП Петров А.В.",
        "title": "Установка модуля аналитики",
        "description": "Конвертирован в сделку.",
        "source": "referral",
        "status": "converted",
        "priority": "medium",
        "assigned_to": "a0000000-0000-0000-0000-000000000003",
        "assigned_to_name": "Анна Смирнова",
        "score": 90,
        "created_at": DAYS_AGO(10),
        "responded_at": DAYS_AGO(10),
        "sla_deadline": None,
        "contacts": [{"name": "Алексей Петров", "phone": "+7 (916) 555-12-34", "email": "petrov.av@mail.ru", "telegram": "@alexey_petrov", "max_messenger": "petrov.max"}],
    },
    {
        "id": "l1000000-0000-0000-0000-000000000008",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "customer_name": "unknown",
        "title": "Спам: предложение о сотрудничестве",
        "description": "Нецелевое обращение, спам.",
        "source": "email",
        "status": "rejected",
        "priority": "low",
        "assigned_to": None,
        "assigned_to_name": None,
        "score": 10,
        "created_at": DAYS_AGO(7),
        "responded_at": None,
        "sla_deadline": None,
        "contacts": [],
    },
]

MOCK_DEALS = [
    {
        "id": "d1000000-0000-0000-0000-000000000001",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "lead_id": "l1000000-0000-0000-0000-000000000001",
        "title": "Разработка CRM-системы для Ромашки",
        "description": "Полный цикл внедрения: 15 пользователей, IP-телефония, email-интеграция, обучение.",
        "amount": 500000,
        "currency": "RUB",
        "stage_id": "b1000000-0000-0000-0000-000000000001",
        "stage_name": "Новый",
        "stage_order": 1,
        "status": "open",
        "probability": 10,
        "expected_close_date": "2026-08-15",
        "actual_close_date": None,
        "assigned_to_name": "Иван Петров",
        "tasks": [
            {"id": "t1", "title": "Позвонить Ивану Иванову", "status": "pending", "due_date": HOURS_AGO(-1), "type": "call"},
            {"id": "t2", "title": "Подготовить КП", "status": "pending", "due_date": HOURS_AGO(-24), "type": "document"},
        ],
        "documents": [],
        "created_at": DAYS_AGO(1),
    },
    {
        "id": "d1000000-0000-0000-0000-000000000002",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "lead_id": None,
        "title": "Комплексная автоматизация бизнеса",
        "description": "Внедрение CRM + ERP интеграция + миграция данных. Крупный контракт.",
        "amount": 1200000,
        "currency": "RUB",
        "stage_id": "b1000000-0000-0000-0000-000000000004",
        "stage_name": "КП отправлено",
        "stage_order": 4,
        "status": "open",
        "probability": 50,
        "expected_close_date": "2026-07-30",
        "actual_close_date": None,
        "assigned_to_name": "Игорь Сидоров",
        "tasks": [
            {"id": "t3", "title": "Follow-up звонок", "status": "pending", "due_date": HOURS_AGO(-48), "type": "call"},
        ],
        "documents": [
            {"id": "doc1", "name": "КП_ТехноЛогик_v2.pdf", "type": "quote", "created_at": DAYS_AGO(1)},
        ],
        "created_at": DAYS_AGO(8),
    },
    {
        "id": "d1000000-0000-0000-0000-000000000003",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "customer_name": "ИП Петров А.В.",
        "lead_id": "l1000000-0000-0000-0000-000000000007",
        "title": "Установка модуля аналитики",
        "description": "Дополнительный модуль аналитики и отчётов.",
        "amount": 150000,
        "currency": "RUB",
        "stage_id": "b1000000-0000-0000-0000-000000000002",
        "stage_name": "Квалификация",
        "stage_order": 2,
        "status": "open",
        "probability": 20,
        "expected_close_date": "2026-07-20",
        "actual_close_date": None,
        "assigned_to_name": "Анна Смирнова",
        "tasks": [],
        "documents": [],
        "created_at": DAYS_AGO(3),
    },
    {
        "id": "d1000000-0000-0000-0000-000000000004",
        "customer_id": "c1000000-0000-0000-0000-000000000005",
        "customer_name": "ООО «Гамма-Трейд»",
        "lead_id": None,
        "title": "Поддержка серверов 24/7",
        "description": "Годовой контракт на техническую поддержку.",
        "amount": 500000,
        "currency": "RUB",
        "stage_id": "b1000000-0000-0000-0000-000000000008",
        "stage_name": "Выиграно",
        "stage_order": 8,
        "status": "won",
        "probability": 100,
        "expected_close_date": "2026-06-27",
        "actual_close_date": "2026-06-27",
        "assigned_to_name": "Игорь Сидоров",
        "tasks": [],
        "documents": [
            {"id": "doc2", "name": "Договор_Гамма-Трейд.pdf", "type": "contract", "created_at": DAYS_AGO(2)},
            {"id": "doc3", "name": "Счёт_GT-0001.pdf", "type": "invoice", "created_at": DAYS_AGO(2)},
        ],
        "created_at": DAYS_AGO(10),
    },
    {
        "id": "d1000000-0000-0000-0000-000000000005",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "customer_name": "Анна Смирнова",
        "lead_id": None,
        "title": "CRM для дизайн-студии",
        "description": "Базовый пакет CRM для малого бизнеса.",
        "amount": 200000,
        "currency": "RUB",
        "stage_id": "b1000000-0000-0000-0000-000000000001",
        "stage_name": "Новый",
        "stage_order": 1,
        "status": "open",
        "probability": 10,
        "expected_close_date": "2026-08-01",
        "actual_close_date": None,
        "assigned_to_name": "Иван Петров",
        "tasks": [],
        "documents": [],
        "created_at": DAYS_AGO(1),
    },
    {
        "id": "d1000000-0000-0000-0000-000000000006",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "lead_id": None,
        "title": "Мобильное приложение для отдела продаж",
        "description": "Разработка мобильного приложения для менеджеров в поле.",
        "amount": 800000,
        "currency": "RUB",
        "stage_id": "b1000000-0000-0000-0000-000000000005",
        "stage_name": "Переговоры",
        "stage_order": 5,
        "probability": 65,
        "status": "open",
        "expected_close_date": "2026-08-10",
        "actual_close_date": None,
        "assigned_to_name": "Игорь Сидоров",
        "tasks": [
            {"id": "t4", "title": "Встреча с Д. Орловым", "status": "pending", "due_date": HOURS_AGO(-2), "type": "meeting"},
        ],
        "documents": [],
        "created_at": DAYS_AGO(7),
    },
]


# ── Endpoints ───────────────────────────────────────────────────

@router.get("/customers")
async def mock_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    """List customers with contacts."""
    items = MOCK_CUSTOMERS
    if search:
        s = search.lower()
        items = [c for c in items if s in c["name"].lower() or s in (c.get("inn") or "").lower()]
    return {"data": items, "total": len(items), "page": page, "per_page": per_page}


@router.get("/customers/{customer_id}")
async def mock_customer_detail(customer_id: str):
    """Get full customer detail with contacts and interactions."""
    for c in MOCK_CUSTOMERS:
        if c["id"] == customer_id:
            return c
    return {"error": "Not found"}, 404


@router.get("/leads")
async def mock_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    source: Optional[str] = None,
):
    """List leads with contact info."""
    items = MOCK_LEADS
    if status and status != "all":
        items = [l for l in items if l["status"] == status]
    if source and source != "all":
        items = [l for l in items if l["source"] == source]
    return {"data": items, "total": len(items), "page": page, "per_page": per_page}


@router.get("/leads/{lead_id}")
async def mock_lead_detail(lead_id: str):
    """Get lead detail with customer contacts."""
    for l in MOCK_LEADS:
        if l["id"] == lead_id:
            # Enrich with customer data
            for c in MOCK_CUSTOMERS:
                if c["id"] == l["customer_id"]:
                    l["customer"] = c
                    break
            return l
    return {"error": "Not found"}, 404


@router.get("/deals")
async def mock_deals(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    stage_id: Optional[str] = None,
):
    """List deals."""
    items = MOCK_DEALS
    if status:
        items = [d for d in items if d["status"] == status]
    if stage_id:
        items = [d for d in items if d["stage_id"] == stage_id]
    return {"data": items, "total": len(items), "page": page, "per_page": per_page}


@router.get("/deals/{deal_id}")
async def mock_deal_detail(deal_id: str):
    """Get deal detail with tasks, documents, customer."""
    for d in MOCK_DEALS:
        if d["id"] == deal_id:
            # Enrich with customer
            for c in MOCK_CUSTOMERS:
                if c["id"] == d["customer_id"]:
                    d["customer"] = c
                    break
            return d
    return {"error": "Not found"}, 404


@router.post("/leads/{lead_id}/convert")
async def convert_lead_to_deal(lead_id: str):
    """Convert a lead to a deal (mock)."""
    # Find the lead
    lead = None
    for l in MOCK_LEADS:
        if l["id"] == lead_id:
            lead = l
            break
    if not lead:
        return {"error": "Lead not found"}, 404

    # Update lead status
    lead["status"] = "converted"

    # Create a new deal from the lead
    import uuid as _uuid
    new_deal = {
        "id": f"d_{_uuid.uuid4().hex[:8]}",
        "title": lead["title"],
        "amount": 100000,
        "customer_id": lead.get("customer_id"),
        "customer_name": lead.get("customer_name"),
        "stage_id": "b1000000-0000-0000-0000-000000000001",
        "stage_name": "Новый",
        "stage_order": 1,
        "status": "open",
        "probability": 50,
        "assigned_to_name": lead.get("assigned_to_name"),
        "description": lead.get("description", ""),
        "expected_close_date": None,
        "tasks": [],
        "documents": [],
        "lead_id": lead_id,
    }
    MOCK_DEALS.insert(0, new_deal)
    return {"ok": True, "lead": lead, "deal": new_deal}


@router.get("/pipelines")
async def mock_pipelines():
    """Get pipeline stages."""
    return {
        "data": [{
            "id": "b0000000-0000-0000-0000-000000000001",
            "name": "Основная воронка",
            "is_default": True,
            "stages": [
                {"id": "b1000000-0000-0000-0000-000000000001", "name": "Новый", "order": 1, "probability": 10, "color": "#3B82F6"},
                {"id": "b1000000-0000-0000-0000-000000000002", "name": "Квалификация", "order": 2, "probability": 20, "color": "#8B5CF6"},
                {"id": "b1000000-0000-0000-0000-000000000003", "name": "Встреча", "order": 3, "probability": 35, "color": "#06B6D4"},
                {"id": "b1000000-0000-0000-0000-000000000004", "name": "КП отправлено", "order": 4, "probability": 50, "color": "#F59E0B"},
                {"id": "b1000000-0000-0000-0000-000000000005", "name": "Переговоры", "order": 5, "probability": 65, "color": "#EC4899"},
                {"id": "b1000000-0000-0000-0000-000000000006", "name": "Договор", "order": 6, "probability": 85, "color": "#F97316"},
                {"id": "b1000000-0000-0000-0000-000000000007", "name": "Оплата", "order": 7, "probability": 95, "color": "#84CC16"},
                {"id": "b1000000-0000-0000-0000-000000000008", "name": "Выиграно", "order": 8, "probability": 100, "color": "#10B981", "is_won": True},
            ],
        }]
    }
