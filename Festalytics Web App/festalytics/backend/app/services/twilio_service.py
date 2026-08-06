from __future__ import annotations

import asyncio
import base64
from dataclasses import dataclass, asdict
from typing import Any, Literal
from urllib.parse import quote

import httpx
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client
from twilio.twiml.voice_response import Gather, VoiceResponse

from app.core.config import settings

Decision = Literal["confirm", "cancel", "unknown"]


@dataclass
class BookingState:
    booking_id: str = "demo-booking"
    customer_name: str = "Customer"
    hall_name: str = "Selected Venue"
    guests: int = 0
    event_date: str = "the selected event date"
    phone: str = ""
    status: str = "pending"
    call_sid: str | None = None
    recording_sid: str | None = None
    call_recording_url: str | None = None
    public_recording_url: str | None = None
    proof_url: str | None = None
    last_speech: str | None = None
    decision: str | None = None
    mobile_registered: bool = False
    sheet_name: str | None = None
    sheet_row_number: int | None = None


# One in-memory state per booking row. This prevents a decision from one browser call
# from being applied to every pending Google Sheet row.
booking_states: dict[str, BookingState] = {}
call_to_booking: dict[str, str] = {}
mobile_registered = False
last_booking_id = "demo-booking"


def _base_url() -> str:
    return settings.public_base_url.rstrip("/")


def _client() -> Client:
    if not (settings.twilio_account_sid and settings.twilio_auth_token):
        raise HTTPException(status_code=503, detail="Twilio credentials are not configured in backend/.env")
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def _clean_booking_id(value: Any) -> str:
    text = str(value or "").strip()
    return text or "demo-booking"

def _plain_text(value: Any, fallback: str = "") -> str:
    """Convert Firestore timestamps, sheet objects, numbers, and invalid values into safe voice text."""
    if value is None:
        return fallback
    if isinstance(value, (str, int, float, bool)):
        text = str(value).strip()
        return text or fallback
    # Firestore Timestamp-like object from JS sometimes arrives as a dict.
    if isinstance(value, dict):
        for key in ("date", "value", "label", "text", "formatted", "display", "seconds", "_seconds"):
            if key in value and value[key] is not None:
                if key in ("seconds", "_seconds"):
                    return "the selected event date"
                return _plain_text(value[key], fallback)
        return fallback
    return fallback


def _plain_int(value: Any, fallback: int = 0) -> int:
    try:
        if isinstance(value, dict):
            for key in ("guests", "value", "count", "pax"):
                if key in value:
                    return _plain_int(value[key], fallback)
            return fallback
        text = str(value or "").replace(",", "").strip()
        return int(float(text)) if text else fallback
    except Exception:
        return fallback


def _state(booking_id: str | None = None) -> BookingState:
    global last_booking_id
    bid = _clean_booking_id(booking_id or last_booking_id)
    if bid not in booking_states:
        booking_states[bid] = BookingState(booking_id=bid, mobile_registered=mobile_registered)
    booking_states[bid].mobile_registered = mobile_registered
    last_booking_id = bid
    return booking_states[bid]


def _state_from_call(call_sid: str | None, booking_id: str | None = None) -> BookingState:
    if booking_id:
        return _state(booking_id)
    if call_sid and call_sid in call_to_booking:
        return _state(call_to_booking[call_sid])
    return _state()


def _state_dict(state: BookingState) -> dict[str, Any]:
    data = asdict(state)
    # Keep camelCase aliases for older frontend snippets.
    data.update(
        {
            "bookingId": state.booking_id,
            "callSid": state.call_sid,
            "recordingSid": state.recording_sid,
            "proofUrl": state.proof_url,
            "mobileRegistered": state.mobile_registered,
            "sheetName": state.sheet_name,
            "sheetRowNumber": state.sheet_row_number,
        }
    )
    return data


def set_booking(data: dict[str, Any]) -> dict[str, Any]:
    state = _state(data.get("bookingId") or data.get("booking_id"))
    state.booking_id = _clean_booking_id(data.get("bookingId") or data.get("booking_id") or state.booking_id)
    state.customer_name = _plain_text(data.get("customerName") or data.get("customer_name"), state.customer_name or "Customer")
    state.hall_name = _plain_text(data.get("hallName") or data.get("hall_name"), state.hall_name or "Selected Venue")
    state.guests = _plain_int(data.get("guests"), state.guests or 0)
    state.event_date = _plain_text(data.get("eventDate") or data.get("event_date"), state.event_date or "the selected event date")
    state.phone = _plain_text(data.get("phone") or data.get("customerPhone") or data.get("customer_phone"), state.phone or "")
    state.status = _plain_text(data.get("status"), state.status or "pending").lower()
    state.sheet_name = _plain_text(data.get("sheetName") or data.get("sheet_name"), state.sheet_name or "") or None
    row_number = data.get("sheetRowNumber") or data.get("sheet_row_number") or state.sheet_row_number
    try:
        state.sheet_row_number = int(row_number) if row_number else None
    except Exception:
        state.sheet_row_number = None
    state.mobile_registered = mobile_registered
    return _state_dict(state)


def get_booking_info(booking_id: str | None = None, call_sid: str | None = None) -> dict[str, Any]:
    state = _state_from_call(call_sid, booking_id)
    state.mobile_registered = mobile_registered
    return _state_dict(state)


def create_browser_token() -> dict[str, str]:
    global mobile_registered
    if not (settings.twilio_account_sid and settings.twilio_api_key and settings.twilio_api_secret):
        raise HTTPException(status_code=503, detail="Twilio Voice SDK credentials are not configured in backend/.env")
    token = AccessToken(
        settings.twilio_account_sid,
        settings.twilio_api_key,
        settings.twilio_api_secret,
        identity=settings.twilio_browser_identity,
    )
    token.add_grant(VoiceGrant(incoming_allow=True))
    mobile_registered = True
    for state in booking_states.values():
        state.mobile_registered = True
    jwt = token.to_jwt()
    return {"identity": settings.twilio_browser_identity, "token": jwt.decode() if isinstance(jwt, bytes) else jwt}


def initiate_call(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("booking") or payload
    state = _state(data.get("bookingId") or data.get("booking_id"))
    set_booking(data)
    state = _state(state.booking_id)
    state.status = "pending"
    state.call_recording_url = None
    state.public_recording_url = None
    state.proof_url = None
    state.recording_sid = None
    state.last_speech = None
    state.decision = None

    mode = str(payload.get("mode") or data.get("mode") or "browser").lower()
    browser_modes = {"browser", "client", "mobile", "web"}
    if mode in browser_modes:
        if not mobile_registered:
            raise HTTPException(status_code=400, detail="Mobile browser is not registered. Open PUBLIC_BASE_URL/mobile.html on your phone and tap Register first.")
        to_value = f"client:{settings.twilio_browser_identity}"
    else:
        to_value = state.phone.strip()
        if not to_value:
            raise HTTPException(status_code=400, detail="Customer phone number is required for phone-call mode.")

    encoded_booking_id = quote(state.booking_id, safe="")
    try:
        call = _client().calls.create(
            to=to_value,
            from_=settings.twilio_phone_number,
            url=f"{_base_url()}/api/twilio/twiml-greet?bookingId={encoded_booking_id}",
            method="POST",
            record=True,
            recording_channels="dual",
            recording_status_callback=f"{_base_url()}/api/twilio/recording-done?bookingId={encoded_booking_id}",
            recording_status_callback_method="POST",
            recording_status_callback_event=["completed"],
        )
    except TwilioRestException as exc:
        detail = getattr(exc, "msg", None) or getattr(exc, "message", None) or str(exc)
        code = getattr(exc, "code", None)
        raise HTTPException(status_code=400, detail=f"Twilio could not start the browser call{f' (code {code})' if code else ''}: {detail}")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Twilio could not start the browser call: {str(exc)}")

    state.call_sid = call.sid
    call_to_booking[call.sid] = state.booking_id
    return {"success": True, "callSid": call.sid, "mode": mode, "booking": _state_dict(state)}


def make_greeting_twiml(booking_id: str | None = None, call_sid: str | None = None) -> str:
    state = _state_from_call(call_sid, booking_id)
    response = VoiceResponse()
    greeting = (
        f"Hello. Am I speaking with {state.customer_name}? "
        f"This is a courtesy call from {state.hall_name}. "
        f"I am calling to confirm your upcoming event booking. "
        f"We have your event scheduled for {state.event_date}. "
        f"The booking is for approximately {state.guests} guests. "
        f"Would you like to confirm your booking? Please say yes to confirm, or no to cancel."
    )
    encoded_booking_id = quote(state.booking_id, safe="")
    gather = Gather(
        input="speech",
        language="en-US",
        speech_timeout="auto",
        action=f"{_base_url()}/api/twilio/twiml-response?bookingId={encoded_booking_id}",
        method="POST",
        timeout=12,
    )
    gather.say(greeting, voice="alice", language="en-US")
    response.append(gather)
    response.say("We did not hear a response. We will try reaching you again soon. Thank you. Goodbye.", voice="alice", language="en-US")
    response.hangup()
    return str(response)


def keyword_decide(text: str) -> Decision:
    t = (text or "").lower()
    if not t:
        return "unknown"
    yes = [
        "yes", "yeah", "yep", "yup", "sure", "confirm", "confirmed", "absolutely", "definitely",
        "of course", "go ahead", "please do", "sounds good", "that works", "i do", "i will", "okay", "ok",
        "alright", "correct", "haan", "ji", "bilkul", "theek", "zaroor",
    ]
    no = [
        "no", "nope", "nah", "cancel", "cancelled", "canceled", "don't", "do not", "not anymore", "please cancel",
        "i don't", "won't", "negative", "stop", "nevermind", "never mind", "nahi", "nahin", "nai", "band",
    ]
    if any(word in t for word in yes):
        return "confirm"
    if any(word in t for word in no):
        return "cancel"
    return "unknown"


async def ask_groq_decision(text: str) -> Decision:
    if not text or not settings.twilio_groq_api_key:
        return "unknown"
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.twilio_groq_api_key}", "Content-Type": "application/json"},
                json={
                    "model": settings.groq_text_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "Classify a customer's spoken reply to whether they want to confirm or cancel an event booking. Reply with exactly one word: confirm, cancel, or unknown.",
                        },
                        {"role": "user", "content": f'Customer said: "{text}"'},
                    ],
                    "max_tokens": 5,
                    "temperature": 0,
                },
            )
            res.raise_for_status()
            ans = (res.json()["choices"][0]["message"]["content"] or "").lower().strip()
            if "confirm" in ans:
                return "confirm"
            if "cancel" in ans:
                return "cancel"
    except Exception as exc:
        print(f"Groq decision fallback skipped: {exc}")
    return "unknown"


async def make_response_twiml(speech: str, booking_id: str | None = None, call_sid: str | None = None) -> str:
    state = _state_from_call(call_sid, booking_id)
    state.last_speech = speech or ""
    decision = keyword_decide(speech)
    if decision == "unknown":
        decision = await ask_groq_decision(speech)
    state.decision = decision

    response = VoiceResponse()
    if decision == "confirm":
        state.status = "accepted"
        response.say(
            f"Thank you. Your event at {state.hall_name} on {state.event_date} is now confirmed. We look forward to hosting you. Goodbye.",
            voice="alice",
            language="en-US",
        )
    elif decision == "cancel":
        state.status = "cancelled"
        response.say(
            f"Understood. Your booking for {state.event_date} has been marked as cancelled. Thank you. Goodbye.",
            voice="alice",
            language="en-US",
        )
    else:
        encoded_booking_id = quote(state.booking_id, safe="")
        gather = Gather(
            input="speech",
            language="en-US",
            speech_timeout="auto",
            action=f"{_base_url()}/api/twilio/twiml-response?bookingId={encoded_booking_id}",
            method="POST",
            timeout=12,
        )
        gather.say("Sorry, I did not catch that. Please say yes to confirm, or no to cancel.", voice="alice", language="en-US")
        response.append(gather)
        response.say("We still did not catch a response. We will follow up shortly. Goodbye.", voice="alice", language="en-US")
    response.hangup()
    return str(response)


def save_recording(recording_sid: str | None, recording_url: str | None, booking_id: str | None = None, call_sid: str | None = None) -> dict[str, Any]:
    state = _state_from_call(call_sid, booking_id)
    if recording_sid and not state.call_recording_url:
        state.recording_sid = recording_sid
        relative_url = f"/api/twilio/recording-proxy/{recording_sid}"
        state.call_recording_url = relative_url
        state.public_recording_url = f"{_base_url()}{relative_url}"
        state.proof_url = state.public_recording_url
    return _state_dict(state)


async def recording_proxy(sid: str):
    auth_raw = f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode("utf-8")
    auth = base64.b64encode(auth_raw).decode("utf-8")
    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Recordings/{sid}.mp3"

    async def iterator():
        last_error = None
        async with httpx.AsyncClient(follow_redirects=True, timeout=None) as client:
            # Twilio sometimes calls the recording-completed webhook before the media file is immediately playable.
            # Retrying here prevents the web portal from opening a temporary 404 page for fresh recordings.
            for attempt in range(6):
                try:
                    async with client.stream("GET", url, headers={"Authorization": f"Basic {auth}"}) as response:
                        if response.status_code == 404 and attempt < 5:
                            await asyncio.sleep(2)
                            continue
                        response.raise_for_status()
                        async for chunk in response.aiter_bytes():
                            yield chunk
                        return
                except Exception as exc:
                    last_error = exc
                    if attempt < 5:
                        await asyncio.sleep(2)
                        continue
                    raise last_error

    return StreamingResponse(iterator(), media_type="audio/mpeg")


def xml_response(xml: str):
    return StreamingResponse(iter([xml.encode("utf-8")]), media_type="text/xml")
