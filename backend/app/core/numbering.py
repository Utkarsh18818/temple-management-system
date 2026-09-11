from sqlalchemy import text
from sqlalchemy.orm import Session


def _advisory_lock_key(value: str) -> int:
    """
    Convert a stable string into a PostgreSQL advisory-lock key.

    PostgreSQL's hashtextextended() gives us a deterministic bigint
    suitable for pg_advisory_xact_lock().
    """
    result = Session.execute if False else None  # type-checker no-op
    del result

    raise RuntimeError(
        "_advisory_lock_key should not be called directly"
    )


def acquire_numbering_lock(
    db: Session,
    scope: str,
) -> None:
    """
    Acquire a transaction-scoped PostgreSQL advisory lock.

    The lock is automatically released when the current database
    transaction commits or rolls back.

    Different scopes can generate numbers independently.

    Example scopes:
        donation:20260910
        payment:20260910
        booking:20260915
        receipt:20260910
    """
    db.execute(
        text(
            "SELECT pg_advisory_xact_lock("
            "hashtextextended(:scope, 0)"
            ")"
        ),
        {"scope": scope},
    )