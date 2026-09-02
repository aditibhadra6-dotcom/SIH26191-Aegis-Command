import hashlib
import time
from secrets import randbelow, token_hex

from fastapi import APIRouter, HTTPException

from db import get_db
from models import LoginRequest, OtpRequest
from serializers import camelize, public

router = APIRouter(tags=["auth"])

OTP_TTL_SECONDS = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 5

# In-memory pending-verification store. Fine for a single-process demo
# backend (mirrors how the rest of this app uses mongomock); a production
# deployment would put this in the DB/Redis with the same shape.
_PENDING: dict[str, dict] = {}


def _hash(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _token(operator_id: str) -> str:
    raw = f"{operator_id}:{time.time()}:{token_hex(8)}"
    return hashlib.sha256(raw.encode()).hexdigest()


@router.post("/login")
def login(req: LoginRequest):
    db = get_db()
    operator = db["operators"].find_one({"operator_id": req.operator_id})
    if not operator:
        raise HTTPException(status_code=401, detail="Unknown operator ID")

    clearance = (req.clearance or "").strip()
    if not clearance:
        raise HTTPException(status_code=400, detail="Clearance code required")
    if _hash(clearance) != operator.get("clearance_hash"):
        raise HTTPException(status_code=401, detail="Incorrect clearance code")

    # Generate a real, single-use 6-digit code and hold it server-side.
    # There's no SMS/email gateway wired up in this environment, so we hand
    # the code back to the caller explicitly labelled as a demo delivery —
    # the frontend shows it as "Demo verification code", never pretends it
    # was texted. Swap in a real SMS/email provider here for production.
    otp = f"{randbelow(1_000_000):06d}"
    _PENDING[req.operator_id] = {
        "otp_hash": _hash(otp),
        "expires_at": time.time() + OTP_TTL_SECONDS,
        "attempts": 0,
    }

    return camelize(
        {
            "ok": True,
            **public(operator),
            "demoOtp": otp,
            "demoOtpNote": "No SMS/email gateway is connected in this environment — this code is shown here for demo purposes only.",
            "otpExpiresInSeconds": OTP_TTL_SECONDS,
        }
    )


@router.post("/verify-otp")
def verify_otp(req: OtpRequest):
    db = get_db()
    operator = db["operators"].find_one({"operator_id": req.operator_id})
    if not operator:
        raise HTTPException(status_code=401, detail="Unknown operator ID")

    if not (len(req.otp) == 6 and req.otp.isdigit()):
        raise HTTPException(status_code=400, detail="OTP must be 6 digits")

    pending = _PENDING.get(req.operator_id)
    if not pending:
        raise HTTPException(status_code=401, detail="No verification pending — please sign in again")
    if time.time() > pending["expires_at"]:
        del _PENDING[req.operator_id]
        raise HTTPException(status_code=401, detail="Verification code expired — please sign in again")
    if pending["attempts"] >= MAX_OTP_ATTEMPTS:
        del _PENDING[req.operator_id]
        raise HTTPException(status_code=429, detail="Too many attempts — please sign in again")

    if _hash(req.otp) != pending["otp_hash"]:
        pending["attempts"] += 1
        raise HTTPException(status_code=401, detail="Incorrect verification code")

    del _PENDING[req.operator_id]
    return camelize(
        {
            "ok": True,
            "token": _token(req.operator_id),
            **public(operator),
        }
    )
