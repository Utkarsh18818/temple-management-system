"""PAN format checks and encrypted storage. Format checks are not KYC."""
import base64
import hashlib
import re

from cryptography.fernet import Fernet

from app.core.config import settings


def normalize_pan(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    value = value.strip().upper()
    if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", value):
        raise ValueError("Enter a valid PAN: five letters, four digits and one letter.")
    return value


def mask_pan(value: str | None) -> str | None:
    return "******" + value[-4:] if value else None


def _cipher() -> Fernet:
    # Domain-separated key; keep the configured key stable across deployments.
    secret = settings.PAN_ENCRYPTION_SECRET or settings.JWT_SECRET
    key = hashlib.sha256(("templeos:pan:v1:" + secret).encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_pan(value: str | None) -> str | None:
    return _cipher().encrypt(value.encode()).decode() if value else None


def decrypt_pan(value: str | None) -> str | None:
    return _cipher().decrypt(value.encode()).decode() if value else None
