"""
Mock API for Documents: templates, generated documents, versions.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock/documents", tags=["Mock Documents"])

NOW = datetime.now(timezone.utc)
DAYS_AGO = lambda d: (NOW - timedelta(days=d)).isoformat()

MOCK_TEMPLATES = [
    {
        "id": "tpl10000-0000-0000-0000-000000000001",
        "name": "Коммерческое предложение (стандарт)",
        "type": "quote",
        "description": "Универсальный шаблон КП для услуг внедрения CRM",
        "variables": ["customer_name", "deal_title", "deal_amount", "items", "validity_days", "manager_name", "date"],
        "file_format": "docx",
        "is_active": True,
        "uses_count": 23,
        "last_used": DAYS_AGO(2),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000002",
        "name": "Коммерческое предложение (VIP)",
        "type": "quote",
        "description": "Расширенный шаблон КП для крупных клиентов с индивидуальными условиями",
        "variables": ["customer_name", "deal_title", "deal_amount", "items", "discount", "validity_days", "manager_name", "date"],
        "file_format": "docx",
        "is_active": True,
        "uses_count": 8,
        "last_used": DAYS_AGO(5),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000003",
        "name": "Договор оказания услуг",
        "type": "contract",
        "description": "Стандартный договор на оказание IT-услуг",
        "variables": ["customer_name", "customer_inn", "customer_kpp", "deal_title", "deal_amount", "payment_terms", "date"],
        "file_format": "docx",
        "is_active": True,
        "uses_count": 15,
        "last_used": DAYS_AGO(1),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000004",
        "name": "Счёт на оплату",
        "type": "invoice",
        "description": "Шаблон счёта с реквизитами и QR-кодом для оплаты",
        "variables": ["customer_name", "invoice_number", "items", "total", "due_date"],
        "file_format": "pdf",
        "is_active": True,
        "uses_count": 34,
        "last_used": DAYS_AGO(0),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000005",
        "name": "Акт выполненных работ",
        "type": "act",
        "description": "Акт сдачи-приёмки оказанных услуг",
        "variables": ["customer_name", "customer_inn", "project_name", "milestones", "total", "date"],
        "file_format": "docx",
        "is_active": True,
        "uses_count": 12,
        "last_used": DAYS_AGO(7),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000007",
        "name": "Устав организации",
        "type": "founding",
        "description": "Копия Устава юридического лица (действующая редакция)",
        "variables": ["customer_name", "company_full_name", "inn", "ogrn", "registration_date"],
        "file_format": "pdf",
        "is_active": True,
        "uses_count": 18,
        "last_used": DAYS_AGO(3),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000008",
        "name": "Свидетельство ОГРН / ИНН",
        "type": "founding",
        "description": "Копия свидетельства о госрегистрации (ОГРН) и ИНН",
        "variables": ["customer_name", "ogrn", "inn", "tax_authority"],
        "file_format": "pdf",
        "is_active": True,
        "uses_count": 22,
        "last_used": DAYS_AGO(1),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000009",
        "name": "Приказ о назначении директора",
        "type": "founding",
        "description": "Копия приказа о назначении генерального директора",
        "variables": ["company_full_name", "ceo_name", "appointment_date"],
        "file_format": "pdf",
        "is_active": True,
        "uses_count": 14,
        "last_used": DAYS_AGO(5),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000010",
        "name": "Выписка из ЕГРЮЛ",
        "type": "founding",
        "description": "Выписка из Единого государственного реестра юридических лиц",
        "variables": ["company_full_name", "inn", "ogrn", "issue_date"],
        "file_format": "pdf",
        "is_active": True,
        "uses_count": 31,
        "last_used": DAYS_AGO(0),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000011",
        "name": "Доверенность",
        "type": "founding",
        "description": "Доверенность на право подписи документов",
        "variables": ["company_full_name", "proxy_name", "proxy_position", "valid_until"],
        "file_format": "pdf",
        "is_active": True,
        "uses_count": 7,
        "last_used": DAYS_AGO(10),
    },
    {
        "id": "tpl10000-0000-0000-0000-000000000006",
        "name": "Спецификация к договору",
        "type": "specification",
        "description": "Техническая спецификация работ по договору",
        "variables": ["customer_name", "contract_number", "works_list", "total"],
        "file_format": "docx",
        "is_active": False,
        "uses_count": 3,
        "last_used": DAYS_AGO(30),
    },
]

MOCK_DOCUMENTS = [
    {
        "id": "doc10000-0000-0000-0000-000000000001",
        "type": "quote",
        "name": "КП_ТехноЛогик_Комплексная_автоматизация_v2.pdf",
        "template_name": "Коммерческое предложение (стандарт)",
        "template_id": "tpl10000-0000-0000-0000-000000000001",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_name": "Комплексная автоматизация бизнеса",
        "status": "sent",
        "version": 2,
        "file_format": "pdf",
        "file_size": 245678,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(1),
        "updated_at": DAYS_AGO(1),
        "sent_at": DAYS_AGO(1),
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(5), "created_by_name": "Игорь Сидоров", "change_note": "Первоначальная версия"},
            {"version": 2, "created_at": DAYS_AGO(1), "created_by_name": "Игорь Сидоров", "change_note": "Добавлен модуль аналитики, изменена цена"},
        ],
        "preview_text": "Коммерческое предложение\n\nООО «ТехноЛогик»\nКомплексная автоматизация бизнес-процессов\n\nСостав работ:\n1. Внедрение CRM-системы — 600 000 ₽\n2. Интеграция IP-телефонии — 300 000 ₽\n3. Интеграция Email — 120 000 ₽\n4. Обучение персонала (5 чел.) — 180 000 ₽\n\nИтого: 1 200 000 ₽ (в т.ч. НДС 20%)\n\nСрок действия: 30 дней\n\nМенеджер: Игорь Сидоров",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000002",
        "type": "contract",
        "name": "Договор_Гамма-Трейд_Поддержка_серверов.pdf",
        "template_name": "Договор оказания услуг",
        "template_id": "tpl10000-0000-0000-0000-000000000003",
        "customer_name": "ООО «Гамма-Трейд»",
        "deal_name": "Поддержка серверов 24/7",
        "status": "signed",
        "version": 1,
        "file_format": "pdf",
        "file_size": 387200,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(4),
        "updated_at": DAYS_AGO(2),
        "sent_at": DAYS_AGO(3),
        "signed_at": DAYS_AGO(2),
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(4), "created_by_name": "Игорь Сидоров", "change_note": "Создан из шаблона"},
        ],
        "preview_text": "Договор №45/2026 об оказании услуг\n\nООО «Гамма-Трейд» в лице ген. директора В. Беляева\n\nПредмет договора:\nТехническая поддержка серверного оборудования 24/7\n\nСумма: 500 000 ₽ в год (в т.ч. НДС 20%)\nСрок: 12 месяцев\n\nПодписи сторон:\n_______________ /В. Беляев/\n_______________ /от Исполнителя/",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000003",
        "type": "invoice",
        "name": "Счёт_INV-2026-0001_ТехноЛогик.pdf",
        "template_name": "Счёт на оплату",
        "template_id": "tpl10000-0000-0000-0000-000000000004",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_name": "Комплексная автоматизация бизнеса",
        "status": "paid",
        "version": 1,
        "file_format": "pdf",
        "file_size": 98400,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(5),
        "updated_at": DAYS_AGO(2),
        "sent_at": DAYS_AGO(5),
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(5), "created_by_name": "Игорь Сидоров", "change_note": "Создан"},
        ],
        "preview_text": "СЧЁТ НА ОПЛАТУ № INV-2026-0001\n\nПлательщик: ООО «ТехноЛогик»\nИНН: 7707654321\n\n1. Внедрение CRM-системы — 600 000 ₽\n2. Интеграция IP-телефонии — 300 000 ₽\n3. Интеграция Email — 120 000 ₽\n4. Обучение персонала — 180 000 ₽\n\nИтого к оплате: 1 200 000 ₽\nВ т.ч. НДС 20%: 200 000 ₽\n\nСрок оплаты: до " + (NOW - timedelta(days=0)).strftime("%d.%m.%Y"),
    },
    {
        "id": "doc10000-0000-0000-0000-000000000004",
        "type": "quote",
        "name": "КП_Петров_Аналитика_v1.pdf",
        "template_name": "Коммерческое предложение (стандарт)",
        "template_id": "tpl10000-0000-0000-0000-000000000001",
        "customer_name": "ИП Петров А.В.",
        "deal_name": "Установка модуля аналитики",
        "status": "draft",
        "version": 1,
        "file_format": "pdf",
        "file_size": 156800,
        "created_by_name": "Анна Смирнова",
        "created_at": DAYS_AGO(3),
        "updated_at": DAYS_AGO(3),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(3), "created_by_name": "Анна Смирнова", "change_note": "Черновик"},
        ],
        "preview_text": "Коммерческое предложение\n\nИП Петров А.В.\nУстановка модуля аналитики\n\nСостав работ:\n1. Установка модуля — 100 000 ₽\n2. Настройка отчётов — 25 000 ₽\n3. Обучение — 25 000 ₽\n\nИтого: 150 000 ₽",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000005",
        "type": "act",
        "name": "Акт_Гамма-Трейд_Поддержка_Q2.pdf",
        "template_name": "Акт выполненных работ",
        "template_id": "tpl10000-0000-0000-0000-000000000005",
        "customer_name": "ООО «Гамма-Трейд»",
        "deal_name": "Поддержка серверов 24/7",
        "status": "signed",
        "version": 1,
        "file_format": "pdf",
        "file_size": 145300,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(7),
        "updated_at": DAYS_AGO(6),
        "sent_at": DAYS_AGO(7),
        "signed_at": DAYS_AGO(6),
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(7), "created_by_name": "Игорь Сидоров", "change_note": "Акт за Q2"},
        ],
        "preview_text": "Акт сдачи-приёмки оказанных услуг №5\n\nООО «Гамма-Трейд»\nЗа период: апрель-июнь 2026 г.\n\nОказанные услуги:\n— Техническая поддержка серверов 24/7\n— Мониторинг инфраструктуры\n— Резервное копирование\n\nСумма: 125 000 ₽ за квартал (в т.ч. НДС 20%)\n\nПодписи:",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000006",
        "type": "quote",
        "name": "КП_Ромашка_CRM_v1.pdf",
        "template_name": "Коммерческое предложение (стандарт)",
        "template_id": "tpl10000-0000-0000-0000-000000000001",
        "customer_name": "ООО «Ромашка»",
        "deal_name": "Разработка CRM-системы",
        "status": "generated",
        "version": 1,
        "file_format": "pdf",
        "file_size": 178900,
        "created_by_name": "Иван Петров",
        "created_at": DAYS_AGO(0),
        "updated_at": DAYS_AGO(0),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(0), "created_by_name": "Иван Петров", "change_note": "Сгенерирован из шаблона"},
        ],
        "preview_text": "Коммерческое предложение\n\nООО «Ромашка»\nВнедрение CRM-системы\n\nСостав работ:\n1. Анализ и проектирование — 50 000 ₽\n2. Внедрение CRM (15 польз.) — 350 000 ₽\n3. Интеграция телефонии — 50 000 ₽\n4. Обучение — 50 000 ₽\n\nИтого: 500 000 ₽",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000007",
        "type": "contract",
        "name": "Договор_ТехноЛогик_Моб_приложение.pdf",
        "template_name": "Договор оказания услуг",
        "template_id": "tpl10000-0000-0000-0000-000000000003",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_name": "Мобильное приложение для отдела продаж",
        "status": "sent",
        "version": 1,
        "file_format": "pdf",
        "file_size": 412000,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(2),
        "updated_at": DAYS_AGO(1),
        "sent_at": DAYS_AGO(1),
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(2), "created_by_name": "Игорь Сидоров", "change_note": "Проект договора"},
        ],
        "preview_text": "Договор №18/2026 об оказании услуг\n\nООО «ТехноЛогик»\n\nПредмет: разработка мобильного приложения\nСумма: 800 000 ₽ (в т.ч. НДС 20%)\nСрок: 3 месяца\n\nЭтапы:\n1. Проектирование — 30%\n2. Разработка — 40%\n3. Тестирование и сдача — 30%",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000008",
        "type": "invoice",
        "name": "Счёт_INV-2026-0003_Гамма-Трейд.pdf",
        "template_name": "Счёт на оплату",
        "template_id": "tpl10000-0000-0000-0000-000000000004",
        "customer_name": "ООО «Гамма-Трейд»",
        "deal_name": "Поддержка серверов 24/7",
        "status": "paid",
        "version": 1,
        "file_format": "pdf",
        "file_size": 89200,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(7),
        "updated_at": DAYS_AGO(4),
        "sent_at": DAYS_AGO(7),
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(7), "created_by_name": "Игорь Сидоров", "change_note": "Создан"},
        ],
        "preview_text": "СЧЁТ НА ОПЛАТУ № INV-2026-0003\n\nПлательщик: ООО «Гамма-Трейд»\nИНН: 780567890123\n\nУслуга: Техническая поддержка 24/7 (годовой контракт)\n\nИтого к оплате: 500 000 ₽\nВ т.ч. НДС 20%: 83 333 ₽",
    },
    {
        "id": "doc10000-0000-0000-0000-000000000009",
        "type": "founding",
        "name": "Устав_ООО_Ромашка_редакция3.pdf",
        "template_name": "Устав организации",
        "template_id": "tpl10000-0000-0000-0000-000000000007",
        "customer_name": "ООО «Ромашка»",
        "deal_name": None,
        "status": "verified",
        "version": 3,
        "file_format": "pdf",
        "file_size": 512000,
        "created_by_name": "Иван Петров",
        "created_at": DAYS_AGO(30),
        "updated_at": DAYS_AGO(3),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(30), "created_by_name": "Иван Петров", "change_note": "Первая редакция Устава"},
            {"version": 2, "created_at": DAYS_AGO(15), "created_by_name": "Иван Петров", "change_note": "Изменение юридического адреса"},
            {"version": 3, "created_at": DAYS_AGO(3), "created_by_name": "Иван Петров", "change_note": "Актуальная редакция, увеличение уставного капитала"},
        ],
        "preview_text": "УСТАВ\nОбщества с ограниченной ответственностью «Ромашка»\n(новая редакция)\n\nг. Москва\n\n1. ОБЩИЕ ПОЛОЖЕНИЯ\n1.1. Общество с ограниченной ответственностью «Ромашка»...\n2. УСТАВНЫЙ КАПИТАЛ\n2.1. Уставный капитал составляет 100 000 рублей...",
        "expiry_date": None,
    },
    {
        "id": "doc10000-0000-0000-0000-000000000010",
        "type": "founding",
        "name": "Свидетельство_ОГРН_ТехноЛогик.pdf",
        "template_name": "Свидетельство ОГРН / ИНН",
        "template_id": "tpl10000-0000-0000-0000-000000000008",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_name": None,
        "status": "verified",
        "version": 1,
        "file_format": "pdf",
        "file_size": 234000,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(20),
        "updated_at": DAYS_AGO(20),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(20), "created_by_name": "Игорь Сидоров", "change_note": "Загружена копия"},
        ],
        "preview_text": "СВИДЕТЕЛЬСТВО\nО ГОСУДАРСТВЕННОЙ РЕГИСТРАЦИИ ЮРИДИЧЕСКОГО ЛИЦА\n\nОГРН: 1057748001234\nИНН: 7707654321\nКПП: 770701001\n\nДата регистрации: 15.03.2005\nНалоговый орган: ИФНС № 7 по г. Москве\n\nПолное наименование: Общество с ограниченной ответственностью «ТехноЛогик»",
        "expiry_date": None,
    },
    {
        "id": "doc10000-0000-0000-0000-000000000011",
        "type": "founding",
        "name": "Выписка_ЕГРЮЛ_Гамма-Трейд.pdf",
        "template_name": "Выписка из ЕГРЮЛ",
        "template_id": "tpl10000-0000-0000-0000-000000000010",
        "customer_name": "ООО «Гамма-Трейд»",
        "deal_name": None,
        "status": "verified",
        "version": 1,
        "file_format": "pdf",
        "file_size": 367000,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(8),
        "updated_at": DAYS_AGO(8),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(8), "created_by_name": "Игорь Сидоров", "change_note": "Получена выписка из ФНС"},
        ],
        "preview_text": "ВЫПИСКА\nиз Единого государственного реестра юридических лиц\n\nПолное наименование: ООО «Гамма-Трейд»\nОГРН: 1087746005678\nИНН: 780567890123\n\nСостояние: действующее\nДата присвоения ОГРН: 20.08.2008\nЮридический адрес: г. Санкт-Петербург, ул. Лиговский пр., д. 50",
        "expiry_date": None,
    },
    {
        "id": "doc10000-0000-0000-0000-000000000012",
        "type": "founding",
        "name": "Приказ_назначение_директора_ТехноЛогик.pdf",
        "template_name": "Приказ о назначении директора",
        "template_id": "tpl10000-0000-0000-0000-000000000009",
        "customer_name": "ООО «ТехноЛогик»",
        "deal_name": None,
        "status": "verified",
        "version": 1,
        "file_format": "pdf",
        "file_size": 89000,
        "created_by_name": "Игорь Сидоров",
        "created_at": DAYS_AGO(18),
        "updated_at": DAYS_AGO(18),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(18), "created_by_name": "Игорь Сидоров", "change_note": "Загружен скан приказа"},
        ],
        "preview_text": "ПРИКАЗ № 1-К\n\n«О назначении генерального директора»\n\nг. Москва\n\nВ соответствии с решением единственного учредителя...\n\nНАЗНАЧИТЬ:\nМорозова Сергея Анатольевича на должность Генерального директора\nООО «ТехноЛогик» с 01.01.2025 г.",
        "expiry_date": None,
    },
    {
        "id": "doc10000-0000-0000-0000-000000000013",
        "type": "founding",
        "name": "Доверенность_Ромашка_на_Петрова.pdf",
        "template_name": "Доверенность",
        "template_id": "tpl10000-0000-0000-0000-000000000011",
        "customer_name": "ООО «Ромашка»",
        "deal_name": None,
        "status": "expires_soon",
        "version": 1,
        "file_format": "pdf",
        "file_size": 156000,
        "created_by_name": "Иван Петров",
        "created_at": DAYS_AGO(90),
        "updated_at": DAYS_AGO(90),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": DAYS_AGO(90), "created_by_name": "Иван Петров", "change_note": "Доверенность сроком на 1 год"},
        ],
        "preview_text": "ДОВЕРЕННОСТЬ № 15/2025\n\nг. Москва, «15» января 2026 г.\n\nОбщество с ограниченной ответственностью «Ромашка» ...\nдоверяет Петрову Алексею Владимировичу ...\nпредставлять интересы Общества ...\n\nДоверенность действительна до 15 января 2027 г.",
        "expiry_date": (NOW + timedelta(days=15)).strftime("%Y-%m-%d"),
    },
]


@router.get("/")
async def list_documents(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer: Optional[str] = Query(None, description="Filter by customer name"),
):
    """List documents."""
    items = MOCK_DOCUMENTS
    if type:
        items = [d for d in items if d["type"] == type]
    if status:
        items = [d for d in items if d["status"] == status]
    if customer:
        items = [d for d in items if d.get("customer_name") and customer.lower() in d["customer_name"].lower()]
    return {"data": items, "total": len(items)}


@router.get("/templates")
async def list_templates():
    """List document templates."""
    return {"data": MOCK_TEMPLATES, "total": len(MOCK_TEMPLATES)}


@router.get("/{doc_id}")
async def get_document_detail(doc_id: str):
    """Get document detail with versions."""
    for d in MOCK_DOCUMENTS:
        if d["id"] == doc_id:
            return d
    return {"error": "Not found"}, 404


@router.post("/generate", status_code=201)
async def generate_document(data: dict):
    """Generate a new document from template (mock)."""
    template_id = data.get("template_id", "")
    template = None
    for t in MOCK_TEMPLATES:
        if t["id"] == template_id:
            template = t
            break
    template_name = template["name"] if template else "Шаблон"

    doc_type = template["type"] if template else "quote"
    customer_name = data.get("customer_name", "Клиент")
    deal_name = data.get("deal_name", "")

    type_labels = {"quote": "КП", "contract": "Договор", "invoice": "Счёт", "act": "Акт", "specification": "Спецификация"}
    label = type_labels.get(doc_type, "Документ")

    name_parts = [label, customer_name.replace("ООО ", "").replace("«", "").replace("»", "").replace("ИП ", "")]
    if deal_name:
        name_parts.append(deal_name[:20])
    name = "_".join(name_parts) + ".pdf"

    new_doc = {
        "id": f"doc_{uuid.uuid4().hex[:8]}",
        "type": doc_type,
        "name": name,
        "template_name": template_name,
        "template_id": template_id,
        "customer_name": customer_name,
        "deal_name": deal_name,
        "status": "generated",
        "version": 1,
        "file_format": "pdf",
        "file_size": 150000 + len(name) * 100,
        "created_by_name": "Иван Петров",
        "created_at": NOW.isoformat(),
        "updated_at": NOW.isoformat(),
        "sent_at": None,
        "signed_at": None,
        "versions": [
            {"version": 1, "created_at": NOW.isoformat(), "created_by_name": "Иван Петров", "change_note": "Сгенерирован из шаблона"},
        ],
        "preview_text": f"{label} для {customer_name}\n\nСгенерирован из шаблона: {template_name}\nДата: {NOW.strftime('%d.%m.%Y')}",
    }

    # Update template usage
    if template:
        template["uses_count"] += 1
        template["last_used"] = NOW.isoformat()

    MOCK_DOCUMENTS.insert(0, new_doc)
    return new_doc


@router.post("/{doc_id}/send", status_code=200)
async def send_document(doc_id: str):
    """Send document to client (mock)."""
    for d in MOCK_DOCUMENTS:
        if d["id"] == doc_id:
            d["status"] = "sent"
            d["sent_at"] = NOW.isoformat()
            return {"status": "ok", "document": d}
    return {"error": "Not found"}, 404
