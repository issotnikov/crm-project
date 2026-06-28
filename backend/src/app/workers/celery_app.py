"""
Celery application configuration.
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "crm_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # Timezone
    timezone="Europe/Moscow",
    enable_utc=True,
    # Task routing
    task_routes={
        "app.workers.ingestion_tasks.*": {"queue": "ingestion"},
        "app.workers.document_tasks.*": {"queue": "documents"},
        "app.workers.notification_tasks.*": {"queue": "default"},
        "app.workers.scheduled_tasks.*": {"queue": "default"},
    },
    # Performance
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Reliability
    task_default_retry_delay=60,
    task_max_retries=3,
)

# ── Beat Schedule (periodic tasks) ──────────────────────────────────────────

celery_app.conf.beat_schedule = {
    # Ingestion
    "imap-poll": {
        "task": "app.workers.scheduled_tasks.poll_imap",
        "schedule": 30.0,  # every 30 seconds
    },
    "telegram-poll": {
        "task": "app.workers.scheduled_tasks.poll_telegram",
        "schedule": 2.0,  # every 2 seconds
    },
    # SLA & reminders
    "sla-check": {
        "task": "app.workers.scheduled_tasks.check_sla",
        "schedule": crontab(minute="*/5"),  # every 5 minutes
    },
    "task-reminders": {
        "task": "app.workers.scheduled_tasks.send_task_reminders",
        "schedule": crontab(minute=0),  # hourly
    },
    "overdue-check": {
        "task": "app.workers.scheduled_tasks.check_overdue_tasks",
        "schedule": crontab(minute=0),  # hourly
    },
    # Daily reports
    "morning-digest": {
        "task": "app.workers.scheduled_tasks.morning_digest",
        "schedule": crontab(hour=9, minute=0),  # 09:00 daily
    },
    "daily-summary": {
        "task": "app.workers.scheduled_tasks.daily_summary",
        "schedule": crontab(hour=18, minute=0),  # 18:00 daily
    },
    # Invoice overdue check
    "invoice-overdue": {
        "task": "app.workers.scheduled_tasks.check_overdue_invoices",
        "schedule": crontab(hour=10, minute=0),  # 10:00 daily
    },
    # Maintenance
    "auto-archive": {
        "task": "app.workers.scheduled_tasks.auto_archive",
        "schedule": crontab(hour=2, minute=0),  # 02:00 daily
    },
}
