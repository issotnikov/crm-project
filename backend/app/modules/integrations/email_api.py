"""
Email Integration Module — IMAP receive + SMTP send.

This is an OPTIONAL module, enabled via environment variables:
  EMAIL_ENABLED=true           — enable module
  EMAIL_IMAP_HOST=imap.host.ru — IMAP server
  EMAIL_IMAP_PORT=993          — IMAP port (993 SSL, 143 plain)
  EMAIL_SMTP_HOST=smtp.host.ru — SMTP server
  EMAIL_SMTP_PORT=465          — SMTP port (465 SSL, 587 STARTTLS)
  EMAIL_USER=user@domain.ru    — mailbox/login
  EMAIL_PASSWORD=app_password  — password (use App Password for Gmail/Yandex)
  EMAIL_FROM_NAME=CRM System   — display name in From header

When EMAIL_ENABLED is not set or false, module returns mock data.
"""
import os
import asyncio
import email as email_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr, formatdate, make_msgid
from datetime import datetime, timezone
from typing import Optional

import aiosmtplib
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, EmailStr
from loguru import logger

router = APIRouter(prefix="/email", tags=["Email"])


# ── Configuration (from env) ──────────────────────────────────

class EmailSettings:
    def __init__(self):
        self.enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        self.imap_host = os.getenv("EMAIL_IMAP_HOST", "")
        self.imap_port = int(os.getenv("EMAIL_IMAP_PORT", "993"))
        self.imap_ssl = self.imap_port == 993
        self.smtp_host = os.getenv("EMAIL_SMTP_HOST", "")
        self.smtp_port = int(os.getenv("EMAIL_SMTP_PORT", "465"))
        self.smtp_use_tls = self.smtp_port == 587
        self.smtp_use_ssl = self.smtp_port == 465
        self.user = os.getenv("EMAIL_USER", "")
        self.password = os.getenv("EMAIL_PASSWORD", "")
        self.from_name = os.getenv("EMAIL_FROM_NAME", "CRM System")

    def is_configured(self) -> bool:
        return self.enabled and self.imap_host and self.smtp_host and self.user

    def summary(self) -> dict:
        return {
            "enabled": self.enabled,
            "configured": self.is_configured(),
            "imap_host": self.imap_host or None,
            "imap_port": self.imap_port,
            "smtp_host": self.smtp_host or None,
            "smtp_port": self.smtp_port,
            "user": self.user or None,
            "from_name": self.from_name,
            "mode": "live" if self.is_configured() else "mock",
        }


settings = EmailSettings()


# ── Mock data (used when EMAIL_ENABLED != true) ───────────────

NOW = datetime.now(timezone.utc)
MIN_AGO = lambda m: (NOW - timedelta_minutes(m)).isoformat()
H_AGO = lambda h: (NOW - timedelta_hours(h)).isoformat()

def timedelta_minutes(m):
    from datetime import timedelta
    return timedelta(minutes=m)

def timedelta_hours(h):
    from datetime import timedelta
    return timedelta(hours=h)

MOCK_INBOX = [
    {
        "id": "em100000-0000-0000-0000-000000000001",
        "folder": "inbox",
        "from_email": "i.ivanov@romashka.ru",
        "from_name": "Иван Иванов (Ромашка)",
        "to_email": "sales@crm.local",
        "to_name": "Отдел продаж CRM",
        "subject": "Re: КП на внедрение CRM-системы",
        "body_text": "Добрый день!\n\nСпасибо за коммерческое предложение. Обсудили с командой — нас интересуют пункты 1 и 2 (внедрение CRM + интеграция телефонии).\n\nКогда можем созвониться для уточнения деталей?\n\nС уважением,\nИван Иванов\nООО «Ромашка»",
        "body_html": None,
        "date": MIN_AGO(15),
        "is_read": False,
        "is_starred": True,
        "has_attachments": True,
        "attachments": [{"filename": "ТЗ_на_интеграцию.pdf", "size": 234000}],
        "customer_name": "ООО «Ромашка»",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
        "lead_id": "l1000000-0000-0000-0000-000000000001",
    },
    {
        "id": "em100000-0000-0000-0000-000000000002",
        "folder": "inbox",
        "from_email": "s.morozov@technologic.ru",
        "from_name": "Сергей Морозов (ТехноЛогик)",
        "to_email": "sales@crm.local",
        "subject": "Вопрос по интеграции с 1С",
        "body_text": "Здравствуйте!\n\nИзучили ваше предложение по комплексной автоматизации. Есть вопрос: возможна ли двусторонняя синхронизация контрагентов с 1С:Бухгалтерия?\n\nЖдем ответа.\n\nСергей Морозов\nИТ-директор ООО «ТехноЛогик»",
        "body_html": None,
        "date": H_AGO(2),
        "is_read": False,
        "is_starred": False,
        "has_attachments": False,
        "attachments": [],
        "customer_name": "ООО «ТехноЛогик»",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
        "lead_id": None,
    },
    {
        "id": "em100000-0000-0000-0000-000000000003",
        "folder": "inbox",
        "from_email": "petrov.av@gmail.com",
        "from_name": "Алексей Петров",
        "to_email": "sales@crm.local",
        "subject": "Запрос КП на модуль аналитики",
        "body_text": "Добрый день!\nПрошу выставить КП на установку модуля аналитики для нашей компании.\nРеквизиты во вложении.\n\nАлексей Петров",
        "body_html": None,
        "date": H_AGO(5),
        "is_read": True,
        "is_starred": False,
        "has_attachments": True,
        "attachments": [{"filename": "Реквизиты_ИП_Петров.docx", "size": 28000}],
        "customer_name": "ИП Петров А.В.",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
        "lead_id": "l1000000-0000-0000-0000-000000000002",
    },
    {
        "id": "em100000-0000-0000-0000-000000000004",
        "folder": "inbox",
        "from_email": "anna@design-studio.ru",
        "from_name": "Анна Смирнова",
        "to_email": "sales@crm.local",
        "subject": "Благодарность",
        "body_text": "Большое спасибо за演示у системы! Команде очень понравилось.\nБудем ждать финальное КП.\n\nАнна",
        "body_html": None,
        "date": H_AGO(24),
        "is_read": True,
        "is_starred": False,
        "has_attachments": False,
        "attachments": [],
        "customer_name": "Дизайн-студия «Анна Смирнова»",
        "customer_id": "c1000000-0000-0000-0000-000000000004",
        "lead_id": None,
    },
]

MOCK_SENT = [
    {
        "id": "em200000-0000-0000-0000-000000000001",
        "folder": "sent",
        "from_email": "sales@crm.local",
        "from_name": "Отдел продаж CRM",
        "to_email": "i.ivanov@romashka.ru",
        "to_name": "Иван Иванов",
        "subject": "КП на внедрение CRM-системы",
        "body_text": "Уважаемый Иван Иванов!\n\nНаправляем коммерческое предложение на внедрение CRM-системы.\n\nСрок действия: 30 дней.",
        "body_html": None,
        "date": H_AGO(3),
        "is_read": True,
        "is_starred": False,
        "has_attachments": True,
        "attachments": [{"filename": "КП_Ромашка_CRM.pdf", "size": 178000}],
        "customer_name": "ООО «Ромашка»",
        "customer_id": "c1000000-0000-0000-0000-000000000001",
    },
    {
        "id": "em200000-0000-0000-0000-000000000002",
        "folder": "sent",
        "from_email": "sales@crm.local",
        "from_name": "Отдел продаж CRM",
        "to_email": "s.morozov@technologic.ru",
        "to_name": "Сергей Морозов",
        "subject": "Re: Комплексная автоматизация бизнеса",
        "body_text": "Сергей, добрый день!\n\nПодготовили.proposal по вашему запросу. КП во вложении.",
        "body_html": None,
        "date": H_AGO(8),
        "is_read": True,
        "is_starred": False,
        "has_attachments": True,
        "attachments": [{"filename": "КП_ТехноЛогик.pdf", "size": 245000}],
        "customer_name": "ООО «ТехноЛогик»",
        "customer_id": "c1000000-0000-0000-0000-000000000003",
    },
    {
        "id": "em200000-0000-0000-0000-000000000003",
        "folder": "sent",
        "from_email": "sales@crm.local",
        "from_name": "Отдел продаж CRM",
        "to_email": "petrov.av@gmail.com",
        "to_name": "Алексей Петров",
        "subject": "Re: Запрос КП на модуль аналитики",
        "body_text": "Алексей, здравствуйте!\n\nКП готовим, направим в течение 2 рабочих дней.",
        "body_html": None,
        "date": H_AGO(4),
        "is_read": True,
        "is_starred": False,
        "has_attachments": False,
        "attachments": [],
        "customer_name": "ИП Петров А.В.",
        "customer_id": "c1000000-0000-0000-0000-000000000002",
    },
]


# ── IMAP receiver ─────────────────────────────────────────────

class IMAPReceiver:
    """Receive emails via IMAP (async, via aiosmtplib-like wrapper)."""

    @staticmethod
    async def fetch_inbox(limit: int = 20) -> list:
        """Fetch recent inbox messages via IMAP."""
        if not settings.is_configured():
            return MOCK_INBOX[:limit]

        import imaplib
        from email.header import decode_header

        def _fetch():
            messages = []
            try:
                if settings.imap_ssl:
                    conn = imaplib.IMAP4_SSL(settings.imap_host, settings.imap_port)
                else:
                    conn = imaplib.IMAP4(settings.imap_host, settings.imap_port)
                conn.login(settings.user, settings.password)
                conn.select("INBOX")
                _, data = conn.search(None, "ALL")
                ids = data[0].split()[-limit:]
                for mid in reversed(ids):
                    _, msg_data = conn.fetch(mid, "(RFC822)")
                    raw = msg_data[0][1]
                    msg = email_lib.message_from_bytes(raw)
                    subject_header = msg.get("Subject", "")
                    decoded_parts = decode_header(subject_header)
                    subject = ""
                    for part, enc in decoded_parts:
                        if isinstance(part, bytes):
                            subject += part.decode(enc or "utf-8", errors="replace")
                        else:
                            subject += part
                    from_header = msg.get("From", "")
                    date_header = msg.get("Date", "")
                    body_text = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body_text = part.get_payload(decode=True).decode(
                                    part.get_content_charset() or "utf-8", errors="replace"
                                )
                                break
                    else:
                        body_text = msg.get_payload(decode=True).decode(
                            msg.get_content_charset() or "utf-8", errors="replace"
                        )
                    attachments = []
                    if msg.is_multipart():
                        for part in msg.walk():
                            fn = part.get_filename()
                            if fn:
                                attachments.append({"filename": fn, "size": len(part.get_payload(decode=True))})
                    messages.append({
                        "id": f"imap_{mid.decode()}",
                        "folder": "inbox",
                        "from_email": from_header,
                        "from_name": "",
                        "to_email": settings.user,
                        "subject": subject,
                        "body_text": body_text[:5000],
                        "body_html": None,
                        "date": date_header,
                        "is_read": False,
                        "has_attachments": len(attachments) > 0,
                        "attachments": attachments,
                    })
                conn.logout()
            except Exception as e:
                logger.error(f"IMAP fetch error: {e}")
            return messages

        return await asyncio.to_thread(_fetch)


# ── SMTP sender ───────────────────────────────────────────────

class SMTPSender:
    """Send emails via SMTP (async)."""

    @staticmethod
    async def send(to_email: str, subject: str, body: str,
                   to_name: str = "", body_html: str = None,
                   reply_to: str = None) -> dict:
        """Send an email via SMTP."""
        if not settings.is_configured():
            # Mock mode — pretend to send
            logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}")
            return {
                "ok": True,
                "mode": "mock",
                "message": f"Email would be sent to {to_email} (mock mode)",
                "message_id": make_msgid(),
            }

        # Build message
        msg = MIMEMultipart("alternative")
        msg["From"] = formataddr((settings.from_name, settings.user))
        msg["To"] = formataddr((to_name, to_email)) if to_name else to_email
        msg["Subject"] = subject
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=settings.user.split("@")[-1] if "@" in settings.user else "crm.local")
        if reply_to:
            msg["Reply-To"] = reply_to

        msg.attach(MIMEText(body, "plain", "utf-8"))
        if body_html:
            msg.attach(MIMEText(body_html, "html", "utf-8"))

        # Send
        try:
            await aiosmtplib.send(
                msg,
                recipients=[to_email],
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.user,
                password=settings.password,
                use_tls=settings.smtp_use_tls,
                start_tls=settings.smtp_use_tls,
            )
            logger.info(f"Email sent to {to_email}: {subject}")
            return {"ok": True, "mode": "live", "message_id": msg["Message-ID"]}
        except Exception as e:
            logger.error(f"SMTP send error: {e}")
            return {"ok": False, "error": str(e)}


# ── Pydantic Models ───────────────────────────────────────────

class SendEmailRequest(BaseModel):
    to_email: str = Field(..., description="Recipient email")
    to_name: str = Field("", description="Recipient name")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body (plain text)")
    body_html: Optional[str] = Field(None, description="HTML body (optional)")
    customer_id: Optional[str] = Field(None, description="Link to customer")
    reply_to_email: Optional[str] = Field(None, description="Reply-To address")


# ── API Endpoints ─────────────────────────────────────────────

@router.get("/status")
async def email_status():
    """Get email module status and configuration."""
    s = settings.summary()
    s["inbox_count"] = len(MOCK_INBOX)
    s["sent_count"] = len(MOCK_SENT)
    s["unread_count"] = len([m for m in MOCK_INBOX if not m["is_read"]])
    return s


@router.get("/inbox")
async def list_inbox(
    limit: int = Query(50, le=100),
    unread_only: bool = Query(False),
):
    """List inbox messages."""
    if settings.is_configured():
        messages = await IMAPReceiver.fetch_inbox(limit)
    else:
        messages = MOCK_INBOX
    if unread_only:
        messages = [m for m in messages if not m["is_read"]]
    return {"data": messages[:limit], "total": len(messages), "folder": "inbox"}


@router.get("/sent")
async def list_sent(limit: int = Query(50, le=100)):
    """List sent messages."""
    messages = MOCK_SENT[:limit]
    return {"data": messages, "total": len(messages), "folder": "sent"}


@router.post("/send")
async def send_email(req: SendEmailRequest):
    """Send an email via SMTP."""
    result = await SMTPSender.send(
        to_email=req.to_email, subject=req.subject, body=req.body,
        to_name=req.to_name, body_html=req.body_html,
        reply_to=req.reply_to_email,
    )
    # Save to sent (mock store)
    if result.get("ok"):
        new_msg = {
            "id": f"em2{os.urandom(4).hex()}",
            "folder": "sent",
            "from_email": settings.user or "sales@crm.local",
            "from_name": settings.from_name,
            "to_email": req.to_email,
            "to_name": req.to_name,
            "subject": req.subject,
            "body_text": req.body,
            "body_html": req.body_html,
            "date": datetime.now(timezone.utc).isoformat(),
            "is_read": True,
            "is_starred": False,
            "has_attachments": False,
            "attachments": [],
            "customer_id": req.customer_id,
        }
        MOCK_SENT.insert(0, new_msg)
    return result


@router.get("/providers/{provider}")
async def get_provider_preset(provider: str):
    """Get recommended IMAP/SMTP settings for common providers."""
    presets = {
        "yandex": {
            "name": "Яндекс 360 (почта для бизнеса)",
            "imap_host": "imap.yandex.ru",
            "imap_port": 993,
            "smtp_host": "smtp.yandex.ru",
            "smtp_port": 465,
            "note": "Требуется пароль приложения (App Password). "
                    "Включите IMAP: Настройки → Все настройки → Почтовые программы.",
            "env_vars": {
                "EMAIL_ENABLED": "true",
                "EMAIL_IMAP_HOST": "imap.yandex.ru",
                "EMAIL_IMAP_PORT": "993",
                "EMAIL_SMTP_HOST": "smtp.yandex.ru",
                "EMAIL_SMTP_PORT": "465",
                "EMAIL_USER": "you@yandex.ru",
                "EMAIL_PASSWORD": "app_password_from_yandex",
                "EMAIL_FROM_NAME": "CRM System",
            },
        },
        "gmail": {
            "name": "Google Workspace (Gmail)",
            "imap_host": "imap.gmail.com",
            "imap_port": 993,
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 465,
            "note": "Обязательно используйте App Password (16 символов). "
                    "Включите IMAP: Settings → See all settings → Forwarding and POP/IMAP.",
            "env_vars": {
                "EMAIL_ENABLED": "true",
                "EMAIL_IMAP_HOST": "imap.gmail.com",
                "EMAIL_IMAP_PORT": "993",
                "EMAIL_SMTP_HOST": "smtp.gmail.com",
                "EMAIL_SMTP_PORT": "465",
                "EMAIL_USER": "you@gmail.com",
                "EMAIL_PASSWORD": "xxxx_xxxx_xxxx_xxxx",
                "EMAIL_FROM_NAME": "CRM System",
            },
        },
        "mailru": {
            "name": "Mail.ru для бизнеса",
            "imap_host": "imap.mail.ru",
            "imap_port": 993,
            "smtp_host": "smtp.mail.ru",
            "smtp_port": 465,
            "note": "Используйте пароль приложения, если включена 2FA. "
                    "Включите IMAP в настройках почты.",
            "env_vars": {
                "EMAIL_ENABLED": "true",
                "EMAIL_IMAP_HOST": "imap.mail.ru",
                "EMAIL_IMAP_PORT": "993",
                "EMAIL_SMTP_HOST": "smtp.mail.ru",
                "EMAIL_SMTP_PORT": "465",
                "EMAIL_USER": "you@domain.ru",
                "EMAIL_PASSWORD": "your_password",
                "EMAIL_FROM_NAME": "CRM System",
            },
        },
        "exchange": {
            "name": "Microsoft Exchange / Outlook",
            "imap_host": "outlook.office365.com",
            "imap_port": 993,
            "smtp_host": "smtp.office365.com",
            "smtp_port": 587,
            "note": "Используйте STARTTLS (порт 587). "
                    "Для OAuth2 требуется регистрация в Azure AD.",
            "env_vars": {
                "EMAIL_ENABLED": "true",
                "EMAIL_IMAP_HOST": "outlook.office365.com",
                "EMAIL_IMAP_PORT": "993",
                "EMAIL_SMTP_HOST": "smtp.office365.com",
                "EMAIL_SMTP_PORT": "587",
                "EMAIL_USER": "you@company.com",
                "EMAIL_PASSWORD": "your_password",
                "EMAIL_FROM_NAME": "CRM System",
            },
        },
        "custom": {
            "name": "Свой SMTP/IMAP сервер",
            "imap_host": "mail.your-domain.ru",
            "imap_port": 993,
            "smtp_host": "mail.your-domain.ru",
            "smtp_port": 465,
            "note": "Настройте свой почтовый сервер (Postfix, Dovecot, и т.д.). "
                    "Укажите правильные порты: 993 для IMAPS, 465 для SMTPS, 587 для STARTTLS.",
            "env_vars": {
                "EMAIL_ENABLED": "true",
                "EMAIL_IMAP_HOST": "mail.your-domain.ru",
                "EMAIL_IMAP_PORT": "993",
                "EMAIL_SMTP_HOST": "mail.your-domain.ru",
                "EMAIL_SMTP_PORT": "465",
                "EMAIL_USER": "crm@your-domain.ru",
                "EMAIL_PASSWORD": "strong_password",
                "EMAIL_FROM_NAME": "CRM System",
            },
        },
    }
    if provider not in presets:
        raise HTTPException(404, "Provider not found")
    return presets[provider]
