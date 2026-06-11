"""
Rate limiting (RNF-SEC-06) via slowapi.

Single shared limiter keyed by client IP. Applied only to the
credential-sensitive auth endpoints (login/register, 5 req/min).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.app.core.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)
