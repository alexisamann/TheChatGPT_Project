from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr


class SubscriptionRequest(BaseModel):
    email: EmailStr


class SubscriptionResponse(BaseModel):
    id: str
    email: EmailStr
    subscribed_at: datetime


class RateLimiter:
    """Naive in-memory limiter to slow down obvious abuse."""

    def __init__(self, window_seconds: int = 60, max_requests: int = 5) -> None:
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self._requests: Dict[str, list[float]] = {}

    def check(self, key: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds
        history = self._requests.setdefault(key, [])
        # drop requests outside the window
        while history and history[0] < window_start:
            history.pop(0)
        if len(history) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Zu viele Anfragen, bitte versuche es später erneut.",
            )
        history.append(now)


app = FastAPI(
    title="PulseNova Backend",
    description="Leichtgewichtiges Backend für Newsletter-Anmeldungen.",
)

origins = [
    "http://localhost",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_subscriptions: Dict[str, SubscriptionResponse] = {}
limiter = RateLimiter()


@app.get("/api/health")
def health() -> dict:
    """Simple health probe for uptime checks."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}


@app.post("/api/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def register_subscription(payload: SubscriptionRequest, request: Request) -> SubscriptionResponse:
    client_ip = request.client.host if request.client else "unknown"
    limiter.check(client_ip)

    normalized_email = payload.email.lower()
    if normalized_email in _subscriptions:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Diese E-Mail wurde bereits angemeldet.",
        )

    subscription = SubscriptionResponse(
        id=str(uuid.uuid4()),
        email=payload.email,
        subscribed_at=datetime.now(timezone.utc),
    )
    _subscriptions[normalized_email] = subscription
    return subscription
