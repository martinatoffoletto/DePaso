"""
General utility functions.
"""
import hashlib
from typing import Any


def hash_object(obj: Any) -> str:
    """Hash any object for caching."""
    return hashlib.sha256(str(obj).encode()).hexdigest()
