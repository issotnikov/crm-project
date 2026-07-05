"""
Mock API for Contacts — aggregated contacts from all customer cards.
Includes support for MAX messenger.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock/contacts", tags=["Mock Contacts"])

NOW = datetime.now(timezone.utc)

# Contacts extracted from customer cards (customers_mock.py)
# with MAX messenger field added
MOCK_CONTACTS = [
    {
        "id": "ct100000-0000-0000-0000-000000000001",
        "first_name": "Иван", "last_name": "Иванов", "middle_name": "Петрович",
        "full_name": "Иванов Иван Петрович",
        "position": "Генеральный директор",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "is_primary": True,
        "phones": [
            {"type": "work", "number": "+7 (495) 123-45-67", "label": "Рабочий"},
            {"type": "mobile", "number": "+7 (916) 123-45-67", "label": "Мобильный"},
        ],
        "emails": [
            {"type": "work", "address": "i.ivanov@romashka.ru", "label": "Рабочий"},
        ],
        "telegram": "@ivanov_romashka",
        "max_messenger": "ivanov.max",
        "whatsapp": None,
        "viber": None,
        "birth_date": "1975-03-15",
        "notes": "ЛПР. Принимает решения по IT-бюджету. Любит футбол.",
        "tags": ["ЛПР", "Директор", "IT"],
        "last_contact_at": "2026-06-27T14:30:00Z",
        "created_at": "2026-06-01T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000002",
        "first_name": "Мария", "last_name": "Сидорова", "middle_name": None,
        "full_name": "Сидорова Мария",
        "position": "Заместитель директора по экономике",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "is_primary": False,
        "phones": [
            {"type": "work", "number": "+7 (495) 123-45-68", "label": "Рабочий"},
        ],
        "emails": [
            {"type": "work", "address": "m.sidorova@romashka.ru", "label": "Рабочий"},
        ],
        "telegram": None,
        "max_messenger": None,
        "whatsapp": "+79161234567",
        "viber": None,
        "birth_date": None,
        "notes": "Финансовый директор. Согласует бюджеты.",
        "tags": ["Финансы"],
        "last_contact_at": "2026-06-25T11:00:00Z",
        "created_at": "2026-06-01T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000003",
        "first_name": "Алексей", "last_name": "Петров", "middle_name": "Владимирович",
        "full_name": "Петров Алексей Владимирович",
        "position": "Индивидуальный предприниматель",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "customer_name": "ИП Петров А.В.",
        "is_primary": True,
        "phones": [
            {"type": "mobile", "number": "+7 (903) 555-12-34", "label": "Мобильный"},
        ],
        "emails": [
            {"type": "personal", "address": "petrov.av@gmail.com", "label": "Личный"},
        ],
        "telegram": "@petrov_av",
        "max_messenger": "petrov.max",
        "whatsapp": None,
        "viber": None,
        "birth_date": "1988-07-22",
        "notes": "ИП, интересуется аналитикой. Быстро принимает решения.",
        "tags": ["ЛПР", "ИП"],
        "last_contact_at": "2026-06-26T16:00:00Z",
        "created_at": "2026-06-02T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000004",
        "first_name": "Сергей", "last_name": "Морозов", "middle_name": "Анатольевич",
        "full_name": "Морозов Сергей Анатольевич",
        "position": "ИТ-директор (CIO)",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "is_primary": True,
        "phones": [
            {"type": "work", "number": "+7 (495) 987-65-43", "label": "Рабочий"},
            {"type": "mobile", "number": "+7 (926) 111-22-33", "label": "Мобильный"},
        ],
        "emails": [
            {"type": "work", "address": "s.morozov@technologic.ru", "label": "Рабочий"},
        ],
        "telegram": "@sergey_morozov",
        "max_messenger": "morozov.max",
        "whatsapp": None,
        "viber": None,
        "birth_date": "1979-11-30",
        "notes": "Технический ЛПР. Проверяет все решения по архитектуре.",
        "tags": ["ЛПР", "IT", "CIO"],
        "last_contact_at": "2026-06-27T09:00:00Z",
        "created_at": "2026-06-03T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000005",
        "first_name": "Дмитрий", "last_name": "Орлов", "middle_name": "Сергеевич",
        "full_name": "Орлов Дмитрий Сергеевич",
        "person_type": "person",
        "position": "Руководитель отдела разработки",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "is_primary": False,
        "phones": [
            {"type": "work", "number": "+7 (495) 987-65-50", "label": "Рабочий"},
        ],
        "emails": [
            {"type": "work", "address": "d.orlov@technologic.ru", "label": "Рабочий"},
        ],
        "telegram": "@d_orlov",
        "max_messenger": "orlov.max",
        "whatsapp": None,
        "viber": None,
        "birth_date": None,
        "notes": "Команда разработки под его руководством будет интегрировать API.",
        "tags": ["IT", "Разработка"],
        "last_contact_at": "2026-06-26T10:00:00Z",
        "created_at": "3025-06-05T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000006",
        "first_name": "Анна", "last_name": "Смирнова", "middle_name": None,
        "full_name": "Смирнова Анна",
        "position": "Креативный директор",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "customer_name": "Дизайн-студия «Анна Смирнова»",
        "is_primary": True,
        "phones": [
            {"type": "mobile", "number": "+7 (915) 222-33-44", "label": "Мобильный"},
        ],
        "emails": [
            {"type": "work", "address": "anna@design-studio.ru", "label": "Рабочий"},
        ],
        "telegram": "@anna_design",
        "max_messenger": "anna.max",
        "whatsapp": None,
        "viber": None,
        "birth_date": "1990-04-12",
        "notes": "Владелица студии. Интересует минималистичный UI.",
        "tags": ["ЛПР", "Дизайн"],
        "last_contact_at": "2026-06-24T15:00:00Z",
        "created_at": "2026-06-06T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000007",
        "first_name": "Виктор", "last_name": "Беляев", "middle_name": "Иванович",
        "full_name": "Беляев Виктор Иванович",
        "position": "Генеральный директор",
        "customer_id": "c1000000-0000-0000-0000-000000000005",
        "customer_name": "ООО «Гамма-Трейд»",
        "is_primary": True,
        "phones": [
            {"type": "work", "number": "+7 (812) 333-44-55", "label": "Рабочий"},
            {"type": "mobile", "number": "+7 (921) 444-55-66", "label": "Мобильный"},
        ],
        "emails": [
            {"type": "work", "address": "v.belyaev@gamma-trade.ru", "label": "Рабочий"},
        ],
        "telegram": None,
        "max_messenger": "belyaev.max",
        "whatsapp": "+79214445566",
        "viber": None,
        "birth_date": "1970-09-05",
        "notes": "Решает всё единолично. Предпочитает телефонные звонки.",
        "tags": ["ЛПР", "Директор"],
        "last_contact_at": "2026-06-23T12:00:00Z",
        "created_at": "2026-06-07T10:00:00Z",
    },
    {
        "id": "ct100000-0000-0000-0000-000000000008",
        "first_name": "Ольга", "last_name": "Кузнецова", "middle_name": None,
        "full_name": "Кузнецова Ольга",
        "position": "Заместитель директора",
        "customer_id": "c1000000-0000-0000-0000-000000000005",
        "customer_name": "ООО «Гамма-Трейд»",
        "is primary": False,
        "is_primary": False,
        "phones": [
            {"type": "work", "number": "+7 (812) 333-44-56", "label": "Рабочий"},
        ],
        "emails": [
            {"type": "work", "address": "o.kuznetsova@gamma-trade.ru", "label": "Рабочий"},
        ],
        "telegram": "@kuznetsova_oz",
        "max_messenger": None,
        "whatsapp": None,
        "viber": None,
        "birth_date": None,
        "notes": "Согласует договоры. Документооборот.",
        "tags": ["Финансы"],
        "last_contact_at": "2026-06-22T14:00:00Z",
        " контакта создан": "2026-06-08T10:00:00Z",
        "created_at": "2026-06-08T10:00:00Z",
    },
]


@router.get("/")
async def list_contacts(
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    has_messenger: Optional[str] = Query(None),
    is_primary: Optional[bool] = Query(None),
):
    """List contacts with filters."""
    items = MOCK_CONTACTS
    if search:
        s = search.lower()
        items = [c for c in items if s in c["full_name"].lower() or
                 s in (c.get("position") or "").lower() or
                 s in (c.get("customer_name") or "").lower() or
                 any(s in p["number"] for p in c.get("phones", []))]
    if customer_id:
        items = [c for c in items if c["customer_id"] == customer_id]
    if has_messenger:
        if has_messenger == "telegram":
            items = [c for c in items if c.get("telegram")]
        elif has_messenger == "max":
            items = [c for c in items if c.get("max_messenger")]
        elif has_messenger == "whatsapp":
            items = [c for c in items if c.get("whatsapp")]
    if is_primary is not None:
        items = [c for c in items if c.get("is_primary") == is_primary]
    return {"data": items, "total": len(items)}


@router.get("/{contact_id}")
async def get_contact_detail(contact_id: str):
    """Get contact detail."""
    for c in MOCK_CONTACTS:
        if c["id"] == contact_id:
            return c
    return {"error": "Not found"}, 404


@router.post("/")
async def create_contact(contact: dict):
    """Create a new contact."""
    new_id = f"ct{uuid.uuid4().hex[:8]}"
    new_contact = {
        "id": new_id,
        "first_name": contact.get("first_name", ""),
        "last_name": contact.get("last_name", ""),
        "middle_name": contact.get("middle_name"),
        "full_name": f"{contact.get('last_name', '')} {contact.get('first_name', '')}".strip(),
        "position": contact.get("position"),
        "customer_id": contact.get("customer_id"),
        "customer_name": contact.get("customer_name"),
        "is_primary": contact.get("is_primary", False),
        "phones": contact.get("phones", []),
        "emails": contact.get("emails", []),
        "telegram": contact.get("telegram"),
        "max_messenger": contact.get("max_messenger"),
        "whatsapp": contact.get("whatsapp"),
        "viber": contact.get("viber"),
        "birth_date": contact.get("birth_date"),
        "notes": contact.get("notes", ""),
        "tags": contact.get("tags", []),
        "last_contact_at": None,
        "created_at": NOW.isoformat(),
    }
    MOCK_CONTACTS.append(new_contact)
    return new_contact


@router.patch("/{contact_id}")
async def update_contact(contact_id: str, update: dict):
    """Update a contact."""
    for c in MOCK_CONTACTS:
        if c["id"] == contact_id:
            for k, v in update.items():
                c[k] = v
            return c
    return {"error": "Not found"}, 404
