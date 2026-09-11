from collections import defaultdict
from threading import Lock
from time import monotonic


MAX_FAILED_ATTEMPTS = 5
WINDOW_SECONDS = 15 * 60


_attempts: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _cleanup(timestamps: list[float], now: float) -> list[float]:
    cutoff = now - WINDOW_SECONDS
    return [timestamp for timestamp in timestamps if timestamp > cutoff]


def is_login_blocked(key: str) -> bool:
    now = monotonic()

    with _lock:
        timestamps = _cleanup(_attempts.get(key, []), now)
        _attempts[key] = timestamps

        return len(timestamps) >= MAX_FAILED_ATTEMPTS


def record_failed_login(key: str) -> None:
    now = monotonic()

    with _lock:
        timestamps = _cleanup(_attempts.get(key, []), now)
        timestamps.append(now)
        _attempts[key] = timestamps


def clear_failed_logins(key: str) -> None:
    with _lock:
        _attempts.pop(key, None)
