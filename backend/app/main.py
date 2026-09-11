import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bookings import router as booking_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.devotees import router as devotee_router
from app.api.v1.donations import router as donation_router
from app.api.v1.events import router as event_router
from app.api.v1.festivals import router as festival_router
from app.api.v1.payments import router as payment_router
from app.api.v1.receipts import router as receipt_router
from app.api.v1.seva_slots import router as seva_slot_router
from app.api.v1.sevas import router as seva_router
from app.api.v1.temples import router as temple_router
from app.api.v1.users import router as user_router
from app.core.config import settings
from app.core.database import engine


logger = logging.getLogger(__name__)


app = FastAPI(
    title="TempleOS",
    description=(
        "Temple Management System API for managing "
        "temples, devotees, sevas, donations and events."
    ),
    version="0.1.0",
)


# ---------------------------------------------------------
# Production configuration validation
# ---------------------------------------------------------

settings.validate_production()


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# ---------------------------------------------------------
# API routers
# ---------------------------------------------------------

app.include_router(
    donation_router,
    prefix="/api/v1",
)

app.include_router(
    booking_router,
    prefix="/api/v1",
)

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    audit_router,
    prefix="/api/v1",
)

app.include_router(
    dashboard_router,
    prefix="/api/v1",
)

app.include_router(
    payment_router,
    prefix="/api/v1",
)

app.include_router(
    event_router,
    prefix="/api/v1",
)

app.include_router(
    temple_router,
    prefix="/api/v1",
)

app.include_router(
    festival_router,
    prefix="/api/v1",
)

app.include_router(
    receipt_router,
    prefix="/api/v1",
)

app.include_router(
    user_router,
    prefix="/api/v1",
)

app.include_router(
    devotee_router,
    prefix="/api/v1",
)

app.include_router(
    seva_router,
    prefix="/api/v1",
)

app.include_router(
    seva_slot_router,
    prefix="/api/v1",
)


# ---------------------------------------------------------
# Basic endpoints
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "application": "TempleOS",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:
        logger.exception("Health check database connection failed")

        return {
            "status": "unhealthy",
            "database": "disconnected",
        }
