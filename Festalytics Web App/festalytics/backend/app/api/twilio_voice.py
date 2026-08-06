from __future__ import annotations

from fastapi import APIRouter, Form, Query, Request
from fastapi.responses import JSONResponse
from typing import Any

from pydantic import BaseModel

from app.services.twilio_service import (
    create_browser_token,
    get_booking_info,
    initiate_call,
    make_greeting_twiml,
    make_response_twiml,
    recording_proxy,
    save_recording,
    set_booking,
    xml_response,
)

router = APIRouter(prefix="/twilio", tags=["Twilio Voice Automation"])


class BookingPayload(BaseModel):
    # Keep these loose because online quotation rows can contain Firestore Timestamp objects,
    # nested objects, missing dates, or sheet row values. The service layer sanitizes them.
    bookingId: Any | None = None
    customerName: Any | None = None
    customerPhone: Any | None = None
    displayedNumber: Any | None = None
    hallName: Any | None = None
    guests: Any | None = None
    eventDate: Any | None = None
    status: Any | None = None
    mode: Any | None = "browser"
    sheetName: Any | None = None
    sheetRowNumber: Any | None = None


@router.get("/token")
def token():
    return create_browser_token()


@router.get("/booking-info")
def booking_info(bookingId: str | None = Query(default=None), callSid: str | None = Query(default=None)):
    return get_booking_info(booking_id=bookingId, call_sid=callSid)


@router.post("/booking-info")
def update_booking(payload: BookingPayload):
    return set_booking(payload.model_dump(exclude_none=True))


@router.post("/initiate-call")
def start_call(payload: BookingPayload):
    return initiate_call(payload.model_dump(exclude_none=True))


@router.post("/twiml-greet")
async def twiml_greet(request: Request, bookingId: str | None = Query(default=None)):
    form = await request.form()
    return xml_response(make_greeting_twiml(booking_id=bookingId, call_sid=form.get("CallSid")))


@router.post("/twiml-response")
async def twiml_response(
    SpeechResult: str = Form(default=""),
    CallSid: str = Form(default=""),
    bookingId: str | None = Query(default=None),
):
    return xml_response(await make_response_twiml(SpeechResult, booking_id=bookingId, call_sid=CallSid))


@router.post("/recording-done")
async def recording_done(request: Request, bookingId: str | None = Query(default=None)):
    form = await request.form()
    data = save_recording(form.get("RecordingSid"), form.get("RecordingUrl"), booking_id=bookingId, call_sid=form.get("CallSid"))
    return JSONResponse(data)


@router.get("/recording-proxy/{sid}")
async def proxy_recording(sid: str):
    return await recording_proxy(sid)
