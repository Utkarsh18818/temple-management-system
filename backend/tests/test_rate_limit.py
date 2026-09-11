from app.core.rate_limit import (
    MAX_FAILED_ATTEMPTS,
    clear_failed_logins,
    is_login_blocked,
    record_failed_login,
)


def test_login_rate_limit_blocks_after_max_failed_attempts():
    key = "test-ip|test-user"

    clear_failed_logins(key)

    assert not is_login_blocked(key)

    for _ in range(MAX_FAILED_ATTEMPTS):
        record_failed_login(key)

    assert is_login_blocked(key)

    clear_failed_logins(key)


def test_login_rate_limit_can_be_cleared_after_success():
    key = "test-ip|test-user-success"

    clear_failed_logins(key)

    for _ in range(MAX_FAILED_ATTEMPTS):
        record_failed_login(key)

    assert is_login_blocked(key)

    clear_failed_logins(key)

    assert not is_login_blocked(key)
