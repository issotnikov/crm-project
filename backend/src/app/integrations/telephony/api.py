"""
Telephony Webhook API — receives events from VoIP providers.
"""
from fastapi import APIRouter, Request
from loguru import logger

router = APIRouter(prefix="/webhooks")


@router.post("/telephony")
async def telephony_webhook(request: Request):
    """
    Receive webhook events from the VoIP provider (Mango/UIS/Megaplan).

    Event types:
    - call_start: incoming or outgoing call started
    - call_end: call ended (with duration)
    - recording_available: call recording is ready
    """
    try:
        payload = await request.json()
    except Exception:
        # Some providers send form-encoded data
        form = await request.form()
        payload = dict(form)

    event_type = payload.get("event") or payload.get("type", "unknown")
    call_id = payload.get("call_id", "unknown")

    logger.info(f"Telephony webhook: event={event_type}, call_id={call_id}")

    if event_type == "call_start":
        # Process incoming call
        logger.info(f"Incoming call started: {call_id}")
        # TODO: Create IncomingRequest + Interaction

    elif event_type == "call_end":
        duration = payload.get("duration", 0)
        logger.info(f"Call ended: {call_id}, duration={duration}s")
        # TODO: Update Interaction with duration

    elif event_type == "recording_available":
        recording_url = payload.get("recording_url", "")
        logger.info(f"Recording available: {call_id}, url={recording_url}")
        # TODO: Update Interaction.recording_url

    return {"status": "ok"}
