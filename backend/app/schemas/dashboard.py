from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DashboardSummary(BaseModel):
    total_donations: int
    completed_donations: int
    pending_donations: int
    today_donations: int
    month_donations: int
    total_donation_amount: Decimal
    today_donation_amount: Decimal
    month_donation_amount: Decimal

    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    today_bookings: int

    total_devotees: int
    active_devotees: int
    new_devotees_this_month: int

    active_festivals: int
    upcoming_events: int
    today_events: int


class DashboardDonationItem(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str
    donation_number: str
    donor_name: str
    amount: Decimal
    donation_type: str
    status: str
    donated_at: datetime


class DashboardBookingItem(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str
    booking_number: str
    amount: Decimal
    status: str
    payment_status: str
    booking_date: date


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    recent_donations: list[DashboardDonationItem]
    recent_bookings: list[DashboardBookingItem]