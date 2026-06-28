"""
Celery tasks — scheduled and background jobs.
"""
import asyncio
from loguru import logger

from app.workers.celery_app import celery_app


def run_async(coro):
    """Helper to run async functions in Celery sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.workers.scheduled_tasks.poll_imap")
def poll_imap():
    """Poll IMAP mailbox for new emails (every 30 seconds)."""
    logger.debug("Polling IMAP mailboxes...")
    # TODO: Implement IMAP polling
    # from app.integrations.email.receiver import poll_all_mailboxes
    # run_async(poll_all_mailboxes())
    return {"status": "ok", "task": "imap_poll"}


@celery_app.task(name="app.workers.scheduled_tasks.poll_telegram")
def poll_telegram():
    """Poll Telegram Bot API for updates (every 2 seconds)."""
    logger.debug("Polling Telegram updates...")
    # TODO: Implement Telegram getUpdates long polling
    # from app.integrations.telegram.listener import get_updates
    # run_async(get_updates())
    return {"status": "ok", "task": "telegram_poll"}


@celery_app.task(name="app.workers.scheduled_tasks.check_sla")
def check_sla():
    """Check SLA compliance for leads (every 5 minutes)."""
    logger.info("Running SLA compliance check...")
    # TODO: Query leads with sla_deadline < now() AND status=new
    # Send notifications for violated SLAs
    return {"status": "ok", "task": "sla_check"}


@celery_app.task(name="app.workers.scheduled_tasks.send_task_reminders")
def send_task_reminders():
    """Send reminders for tasks due today (hourly)."""
    logger.info("Sending task reminders...")
    # TODO: Query tasks with due_date = today
    # Send notifications to assignees
    return {"status": "ok", "task": "task_reminders"}


@celery_app.task(name="app.workers.scheduled_tasks.check_overdue_tasks")
def check_overdue_tasks():
    """Check for overdue tasks and escalate (hourly)."""
    logger.info("Checking overdue tasks...")
    # TODO: Query tasks with due_date < now() AND status NOT IN (done, cancelled)
    # Send notifications to assignee + manager
    return {"status": "ok", "task": "overdue_check"}


@celery_app.task(name="app.workers.scheduled_tasks.morning_digest")
def morning_digest():
    """Send morning digest to all active managers (09:00 daily)."""
    logger.info("Sending morning digest...")
    # TODO: For each manager, compile:
    #   - New leads from yesterday/today
    #   - Tasks for today
    #   - Overdue items
    #   - Upcoming meetings
    # Send via email + in-app notification
    return {"status": "ok", "task": "morning_digest"}


@celery_app.task(name="app.workers.scheduled_tasks.daily_summary")
def daily_summary():
    """Send daily summary to managers/head (18:00 daily)."""
    logger.info("Sending daily summary...")
    # TODO: Compile daily stats and send to management
    return {"status": "ok", "task": "daily_summary"}


@celery_app.task(name="app.workers.scheduled_tasks.check_overdue_invoices")
def check_overdue_invoices():
    """Check for overdue invoices and update status (10:00 daily)."""
    logger.info("Checking overdue invoices...")
    # TODO: UPDATE invoices SET status='overdue'
    # WHERE status IN ('sent','partially_paid') AND due_date < CURRENT_DATE
    return {"status": "ok", "task": "invoice_overdue"}


@celery_app.task(name="app.workers.scheduled_tasks.auto_archive")
def auto_archive():
    """Archive old closed leads (02:00 daily)."""
    logger.info("Auto-archiving old leads...")
    # TODO: Archive leads with status IN ('converted', 'rejected') AND created_at < now() - 90 days
    return {"status": "ok", "task": "auto_archive"}


# ── On-demand tasks ──────────────────────────────────────────────────────────

@celery_app.task(name="app.workers.scheduled_tasks.generate_document")
def generate_document(document_id: str, template_id: str, variables: dict):
    """Generate a document (PDF/DOCX) asynchronously."""
    logger.info(f"Generating document {document_id} from template {template_id}")
    # TODO:
    # 1. Load template from S3
    # 2. Fill placeholders with variables
    # 3. Convert to PDF (LibreOffice or WeasyPrint)
    # 4. Upload to S3
    # 5. Update document record (status=generated)
    # 6. Send WebSocket notification
    return {"status": "ok", "document_id": document_id}


@celery_app.task(name="app.workers.scheduled_tasks.send_notification")
def send_notification(user_id: str, channel: str, subject: str, body: str):
    """Send a notification via specified channel (email/telegram/in-app)."""
    logger.info(f"Sending notification to {user_id} via {channel}: {subject}")
    # TODO: Route to appropriate sender
    return {"status": "ok", "user_id": user_id, "channel": channel}
