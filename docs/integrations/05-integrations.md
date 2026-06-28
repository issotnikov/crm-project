# 05. Интеграции

---

## Обзор

| Интеграция | Протокол | Направление | MVP | Назначение |
|-----------|----------|-------------|:---:|-----------|
| Telegram Bot API | HTTPS Long Poll / Webhook | Inbound + Outbound | ✅ | Приём и отправка сообщений |
| Email (IMAP/SMTP) | IMAP, SMTP | Inbound + Outbound | ✅ | Приём и отправка писем |
| IP-телефония | REST API + Webhook | Inbound + Outbound | ✅ | Звонки, записи, call tracking |
| Web-форма сайта | REST API (POST) | Inbound | ✅ | Приём заявок с сайта |
| 1С: Бухгалтерия | REST API / HTTP | Bi-directional | 🔶 Post-MVP | Обмен счетами, актами, контрагентами |
| reCAPTCHA v3 | REST API | Inbound | ✅ | Защита веб-формы от спама |
| Google Calendar | CalDAV / API | Outbound | 🔶 Post-MVP | Синхронизация календарей |
| Elasticsearch | REST API | Internal | 🔶 Post-MVP | Полнотекстовый поиск |
| SMS-провайдер | REST API | Outbound | 🔶 Post-MVP | SMS-уведомления |

---

## 1. Telegram Bot API

### 1.1. Архитектура подключения

```
┌──────────────┐     getUpdates (long poll, 2s)     ┌──────────────────┐
│ Telegram     │◀───────────────────────────────────││ Celery Worker    │
│ Bot API      │───────────────────────────────────▶│ (tg_listener)    │
└──────────────┘     JSON response (updates)        └────────┬─────────┘
       ▲                                                      │
       │ sendMessage / sendDocument / sendPhoto               │ normalize
       │                                                      ▼
       │                                             ┌──────────────────┐
       └─────────────────────────────────────────────│ Celery Worker    │
              Outbound messages (из CRM)             │ (default queue)  │
                                                     └──────────────────┘
```

### 1.2. Конфигурация

```yaml
# config.yaml (или .env)
telegram:
  bot_token: "${TELEGRAM_BOT_TOKEN}"
  webhook_url: null        # null = use long polling; URL = use webhook
  allowed_updates:
    - message
    - contact
    - callback_query
  poll_interval: 2          # seconds
  timeout: 30               # long poll timeout
  auto_reply_template: "Здравствуйте! Спасибо за обращение. С Вами свяжется менеджер в течение 30 минут."
  request_contact_on_start: true
```

### 1.3. Обработка входящих сообщений

```python
# backend/src/app/integrations/telegram/listener.py

async def handle_update(update: dict):
    """Process a single Telegram update."""
    message = update.get("message", {})
    chat_id = message["chat"]["id"]
    user = message.get("from", {})

    # 1. Создание IncomingRequest
    incoming = IncomingRequest(
        source_type="telegram",
        raw_payload=update,
        normalized_data={
            "telegram_id": str(user["id"]),
            "telegram_username": user.get("username"),
            "name": f"{user.get('first_name','')} {user.get('last_name','')}".strip(),
            "phone": None,  # будет запрошен отдельно
            "message": message.get("text", ""),
            "chat_id": chat_id,
        },
    )

    # 2. Если есть shared contact (phone)
    if "contact" in message:
        incoming.normalized_data["phone"] = message["contact"]["phone_number"]

    # 3. Сохранение и отправка в очередь нормализации
    await incoming.save()
    process_incoming_request.delay(incoming.id)
```

### 1.4. Сценарии взаимодействия

| Сценарий | Trigger | Действие системы |
|----------|---------|------------------|
| `/start` | Команда бота | Отправка приветствия + запрос contact (кнопка) |
| Текстовое сообщение | Пользователь написал | Создание лида + автоответ |
| `contact` (поделиться номером) | Нажата кнопка | Обновление телефона, привязка к существующему/новому клиенту |
| Вложение (файл/фото) | Загружен файл | Сохранение в S3, привязка к interaction |
| Ответ из CRM | Менеджер написал в карточке | `sendMessage` пользователю |

### 1.5. Исходящие сообщения

```python
# backend/src/app/integrations/telegram/sender.py

class TelegramSender:
    def __init__(self, bot_token: str):
        self.api_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(
        self,
        chat_id: int,
        text: str,
        reply_to_message_id: int | None = None,
        parse_mode: str = "HTML",
    ) -> dict:
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if reply_to_message_id:
            payload["reply_to_message_id"] = reply_to_message_id

        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.api_url}/sendMessage", json=payload)
            return resp.json()

    async def send_document(self, chat_id: int, file_path: str, caption: str = ""):
        # Загрузка файла в Telegram
        ...

    async def send_photo(self, chat_id: int, photo_url: str, caption: str = ""):
        ...
```

### 1.6. Команды бота

| Команда | Описание | Доступ |
|---------|----------|--------|
| `/start` | Приветствие, запрос контакта | Все |
| `/help` | Справка по возможностям | Все |
| `/manager` | Запрос на связь с живым менеджером | Все |
| `/status` | Статус текущей заявки | Все (по своему telegram_id) |
| `/cancel` | Отмена последнего действия | Все |

---

## 2. Email (IMAP/SMTP)

### 2.1. Архитектура

```
┌──────────────┐     IMAP IDLE / poll (30s)     ┌──────────────────┐
│  Mail Server │◀───────────────────────────────││ Celery Worker    │
│  (IMAP)      │───────────────────────────────▶│ (imap_poller)    │
└──────────────┘     FETCH new messages          └────────┬─────────┘
       ▲                                                      │
       │ SMTP (send)                                          │ parse + normalize
       │                                                      ▼
       │                                             ┌──────────────────┐
       └─────────────────────────────────────────────│ Default Queue    │
       | Outgoing emails (из CRM)                    └──────────────────┘
```

### 2.2. Конфигурация

```yaml
email:
  mailboxes:
    - address: "sales@company.ru"
      imap_server: "imap.company.ru"
      imap_port: 993
      smtp_server: "smtp.company.ru"
      smtp_port: 587
      username: "${MAIL_SALES_USER}"
      password: "${MAIL_SALES_PASS}"
      use_tls: true
    - address: "info@company.ru"
      imap_server: "imap.company.ru"
      # ... same structure
  poll_interval: 30          # seconds
  mark_as_read: true         # mark fetched emails as Seen
  default_signature: |
    С уважением,
    Компания XYZ
```

### 2.3. Обработка входящих писем

```python
# backend/src/app/integrations/email/receiver.py

import imaplib
import email
from email.parser import BytesParser

async def poll_mailbox(mailbox_config: dict):
    """Poll IMAP mailbox for new emails."""
    imap = imaplib.IMAP4_SSL(mailbox_config["imap_server"], mailbox_config["imap_port"])
    imap.login(mailbox_config["username"], mailbox_config["password"])
    imap.select("INBOX")

    # Search for unread emails
    status, messages = imap.search(None, "(UNSEEN)")
    for msg_id in messages[0].split():
        _, msg_data = imap.fetch(msg_id, "(RFC822)")
        raw_email = msg_data[0][1]
        parsed = parse_email(raw_email)

        incoming = IncomingRequest(
            source_type="email",
            raw_payload={"raw_headers": parsed["headers"], "raw_body": parsed["body"]},
            normalized_data={
                "name": extract_name(parsed["from"]),
                "email": extract_email(parsed["from"]),
                "phone": extract_phone_from_text(parsed["body_text"]),
                "message": parsed["body_text"],
                "subject": parsed["subject"],
                "message_id": parsed["message_id"],
            },
        )
        await incoming.save()
        process_incoming_request.delay(incoming.id)

    imap.logout()
```

### 2.4. Отправка писем

```python
# backend/src/app/integrations/email/sender.py

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

async def send_email(
    to: str,
    subject: str,
    body_html: str,
    body_text: str | None = None,
    attachments: list[dict] | None = None,
    reply_to: str | None = None,
):
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to:
        msg["In-Reply-To"] = reply_to
        msg["References"] = reply_to

    msg.attach(MIMEText(body_text or "", "plain"))
    msg.attach(MIMEText(body_html, "html"))

    # Attachments
    if attachments:
        for att in attachments:
            # Add MIMEBase parts
            ...

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
        start_tls=True,
    )
```

### 2.5. Парсинг писем

| Задача | Инструмент | Особенности |
|--------|-----------|-------------|
| Парсинг MIME | `email-parser` / stdlib | Многочастевые письма, кодировки |
| Извлечение текста | BeautifulSoup | HTML → plain text |
| Извлечение телефона | Регулярные выражения | +7, 8 (XXX) XXX-XX-XX |
| Извлечение email | Регулярные выражения | Из body, Reply-To |
| Вложения | Сохранение в S3 | Mime-type, size limits |

### 2.6. Дедупликация писем

```python
# По Message-ID + UID + mailbox (гарантия идемпотентности)
dedup_key = f"{mailbox}:{uid}:{message_id}"
if await IncomingRequest.exists(external_id=dedup_key):
    return  # Уже обработано
```

---

## 3. IP-телефония

### 3.1. Архитектура

```
┌──────────────────┐     Webhook (incoming call)     ┌──────────────────┐
│  VoIP Provider   │─────────────────────────────────▶│ Webhook Endpoint │
│  (Mango/UIS)     │                                 │ /api/v1/webhooks/│
│                  │◀─────────────────────────────────│ telephony        │
│                  │     REST API (click-to-call)     └────────┬─────────┘
└──────────────────┘                                           │
       ▲                                                       │
       │ GET recording URL                                     │ normalize
       │                                                       ▼
       │                                              ┌──────────────────┐
       └──────────────────────────────────────────────│ Default Queue    │
              Async fetch recording                   └──────────────────┘
```

### 3.2. Конфигурация

```yaml
telephony:
  provider: "mango"      # mango | uis | megaplan
  api_key: "${PHONE_API_KEY}"
  api_secret: "${PHONE_API_SECRET}"
  domain: "${PHONE_DOMAIN}"
  webhook_url: "https://crm.company.ru/api/v1/webhooks/telephony"
  recording_storage: "provider"  # provider | s3
  click_to_call_enabled: true
  inbound_group_id: "${PHONE_INBOUND_GROUP_ID}"
```

### 3.3. Webhook: входящий звонок

```python
# backend/src/app/integrations/telephony/webhook.py

@router.post("/webhooks/telephony")
async def telephony_webhook(payload: dict = Body(...)):
    """
    Webhook от провайдера телефонии.
    Mango Office: events = call_start, call_end, recording_available
    """
    event_type = payload.get("event")

    if event_type == "call_start":
        # Входящий или исходящий звонок начался
        incoming = IncomingRequest(
            source_type="phone",
            raw_payload=payload,
            normalized_data={
                "phone": normalize_phone(payload["from"]["number"]),
                "name": None,  # будет определен при дедупликации
                "message": f"Входящий звонок от {payload['from']['number']}",
                "call_id": payload["call_id"],
            },
        )
        await incoming.save()
        process_incoming_request.delay(incoming.id)

    elif event_type == "call_end":
        # Звонок завершен — обновляем interaction
        await update_call_interaction(
            call_id=payload["call_id"],
            duration=payload["duration"],
            status="completed",
        )

    elif event_type == "recording_available":
        # Запись звонка готова
        recording_url = payload["recording_url"]
        await update_call_recording(
            call_id=payload["call_id"],
            recording_url=recording_url,
        )

    return {"status": "ok"}
```

### 3.4. Click-to-Call (исходящий звонок)

```python
# backend/src/app/integrations/telephony/click_to_call.py

async def initiate_call(manager_phone: str, customer_phone: str):
    """Initiate outgoing call via VoIP provider API."""
    # Mango Office API: JSON API
    data = {
        "api_key": settings.PHONE_API_KEY,
        "from": manager_phone,
        "to": customer_phone,
        "command_id": str(uuid.uuid4()),
    }
    sign = compute_sign(data, settings.PHONE_API_SECRET)
    data["sig"] = sign

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://{settings.PHONE_DOMAIN}/api/v2/commands/callback_request",
            data=data,
        )
        return resp.json()
```

### 3.5. Call Tracking

| Сценарий | Реализация |
|----------|-----------|
| Подменные номера | Несколько номеров в провайдере, каждый привязан к источнику (Google Ads, Yandex Direct, VK) |
| UTM-передача | При звонке вебкhook содержит номер вызова → маппинг на источник |
| Запись звонков | Провайдер сохраняет запись, CRM получает URL по вебхуку |

---

## 4. Web-форма сайта

### 4.1. Архитектура

```
┌──────────────────┐     POST /api/v1/public/leads     ┌──────────────────┐
│   Браузер        │───────────────────────────────────▶│ Public API       │
│   (Сайт)         │    {name, phone, email, message}   │ Endpoint         │
│                  │                                    │ (rate-limited)   │
│  ┌────────────┐  │                                    └────────┬─────────┘
│  │ reCAPTCHA  │  │                                             │
│  │  v3 token  │  │                                             │
│  └────────────┘  │                                             ▼
└──────────────────┘                                    ┌──────────────────┐
       ▲                                               │ Default Queue    │
       │                                               └──────────────────┘
       │ Embed script
       │
┌──────┴───────────┐
│  CRM Form Widget │   <script src="https://crm.company.ru/widget.js"
│  (JS embed)      │           data-site-key="abc123"></script>
└──────────────────┘
```

### 4.2. Конфигурация

```yaml
web_form:
  enabled: true
  rate_limit:
    per_ip: 5          # max 5 requests per hour per IP
    per_domain: 100    # max 100 requests per hour per domain
  sites:
    - domain: "company.ru"
      api_key: "${WEBFORM_API_KEY_COMPANY}"
    - domain: "landing.company.ru"
      api_key: "${WEBFORM_API_KEY_LANDING}"
  recaptcha:
    enabled: true
    site_key: "${RECAPTCHA_SITE_KEY}"
    secret_key: "${RECAPTCHA_SECRET_KEY}"
    min_score: 0.5
  honeypot_field: "company_url"  # hidden field, must be empty
```

### 4.3. API Endpoint

```python
# backend/src/app/integrations/webform/api.py

@router.post("/public/leads", status_code=201)
@rate_limit(per_ip="5/hour", per_domain="100/hour")
async def create_lead_from_webform(
    payload: WebFormLeadCreate,
    x_api_key: str = Header(...),
    x_site_domain: str = Header(...),
    request: Request,
):
    # 1. Validate API key
    site = validate_site_api_key(x_api_domain, x_api_key)

    # 2. Verify reCAPTCHA
    if settings.RECAPTCHA_ENABLED:
        await verify_recaptcha(payload.recaptcha_token, request.client.host)

    # 3. Check honeypot
    if payload.company_url:
        # Bot filled the hidden field → silently drop
        return {"status": "ok"}

    # 4. Normalize phone
    phone = normalize_to_e164(payload.phone)

    # 5. Create IncomingRequest
    incoming = IncomingRequest(
        source_type="web_form",
        raw_payload=payload.model_dump(),
        normalized_data={
            "name": payload.name,
            "phone": phone,
            "email": payload.email,
            "message": payload.message,
            "utm": payload.utm,
        },
    )
    await incoming.save()
    process_incoming_request.delay(incoming.id)

    return {"status": "ok", "message": "Заявка принята"}
```

### 4.4. Виджет для встраивания

```html
<!-- Embed on client website -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://crm.company.ru/widget.js';
    s.async = true;
    s.dataset.siteKey = 'abc123';
    s.dataset.position = 'bottom-right';
    document.head.appendChild(s);
  })();
</script>
```

```javascript
// widget.js — lightweight form widget
(function() {
  const siteKey = document.currentScript.dataset.siteKey;
  const position = document.currentScript.dataset.position || 'bottom-right';

  // Create floating button + modal form
  const btn = document.createElement('button');
  btn.className = 'crm-fab';
  btn.innerHTML = '💬';
  btn.style.cssText = `position:fixed;${position}:20px;bottom:20px;...`;

  const modal = createModal();
  btn.onclick = () => modal.show();

  document.body.appendChild(btn);
})();
```

### 4.5. Валидация и защита

| Мера | Реализация |
|------|-----------|
| API Key | Уникальный ключ на домен, в заголовке `X-API-Key` |
| CORS | Whitelist зарегистрированных доменов |
| Rate limiting | Redis sliding window: 5 req/hour/IP, 100 req/hour/domain |
| reCAPTCHA v3 | Score-based, порог 0.5 |
| Honeypot | Скрытое поле, заполнение = бот |
| Server-side validation | Pydantic schema с строгой валидацией |
| Phone normalization | Любой формат → E.164 (+74951234567) |

---

## 5. 1С: Бухгалтерия (Post-MVP)

### 5.1. Сценарий обмена

```
CRM ──▶ 1С: Создание контрагента, выгрузка счёта
1С ──▶ CRM: Статус оплаты, акт выполненных работ
```

### 5.2. Методы обмена

| Метод | Назначение |
|-------|-----------|
| `POST /api/v1/integrations/1c/counterparties` | Создать/обновить контрагента в 1С |
| `POST /api/v1/integrations/1c/invoices` | Выгрузить счёт в 1С |
| `GET /api/v1/integrations/1c/payments` | Получить подтверждения оплат |
| `GET /api/v1/intintegrations/1c/acts` | Получить акты |

### 5.3. Формат обмена (REST/JSON)

```json
// POST /api/v1/integrations/1c/invoices
{
  "invoice_number": "INV-2026-0001",
  "customer": {
    "inn": "7701234567",
    "name": "ООО Ромашка",
    "kpp": "770101001"
  },
  "items": [...],
  "total": 600000.00,
  "vat_amount": 100000.00
}
```

---

## 6. Внутреннее API для расширений

### 6.1. REST API (FastAPI)

Все внешние интеграции и фронтенд работают через единственный REST API.

#### Аутентификация

```
POST /api/v1/auth/login
  Body: {email, password}
  Response: {access_token, refresh_token, token_type: "bearer"}

POST /api/v1/auth/refresh
  Body: {refresh_token}
  Response: {access_token}
```

#### Ключевые эндпоинты

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/v1/customers` | GET, POST | Список/создание клиентов |
| `/api/v1/customers/{id}` | GET, PUT, DELETE | CRUD клиента |
| `/api/v1/customers/{id}/interactions` | GET | Timeline клиента |
| `/api/v1/leads` | GET, POST | Лиды |
| `/api/v1/leads/{id}/convert` | POST | Конвертация в сделку |
| `/api/v1/deals` | GET, POST | Сделки |
| `/api/v1/deals/{id}/stage` | PATCH | Смена стадии |
| `/api/v1/deals/{id}/close` | POST | Закрытие (won/lost) |
| `/api/v1/tasks` | GET, POST, PATCH | Задачи |
| `/api/v1/invoices` | GET, POST | Счета |
| `/api/v1/invoices/{id}/payments` | POST | Регистрация оплаты |
| `/api/v1/documents/generate` | POST | Генерация КП/договора |
| `/api/v1/calendar/events` | GET, POST | Календарь |
| `/api/v1/analytics/dashboard` | GET | Дашборд |
| `/api/v1/analytics/funnel` | GET | Воронка |
| `/api/v1/webhooks/telephony` | POST | Webhook телефонии |
| `/api/v1/public/leads` | POST | Публичная форма (без auth) |

### 6.2. WebSocket (Real-time)

```
WSS /api/v1/ws?token={jwt}
```

| Событие | Направление | Payload |
|---------|-------------|---------|
| `lead.created` | Server → Client | `{lead_id, customer_name, source}` |
| `task.deadline_approaching` | Server → Client | `{task_id, title, due_date}` |
| `interaction.new` | Server → Client | `{interaction_id, customer_id}` |
| `deal.stage_changed` | Server → Client | `{deal_id, old_stage, new_stage}` |
| `notification.new` | Server → Client | `{notification}` |

### 6.3. Webhook API (для внешних систем)

| Webhook | Направление | Payload |
|---------|-------------|---------|
| `lead.created` | CRM → External | URL, настроенный в админке |
| `deal.won` | CRM → External | |
| `payment.received` | CRM → External | |
| Интеграция с 1С, BI, внешними сервисами | | |
