import hashlib
import hmac
from decimal import Decimal

import razorpay

from app.core.config import settings


class RazorpayService:
    def _get_key_id(self) -> str:
        if not settings.RAZORPAY_KEY_ID:
            raise RuntimeError("RAZORPAY_KEY_ID is not configured")

        return settings.RAZORPAY_KEY_ID

    def _get_client(self) -> razorpay.Client:
        key_id = self._get_key_id()

        if not settings.RAZORPAY_KEY_SECRET:
            raise RuntimeError("RAZORPAY_KEY_SECRET is not configured")

        return razorpay.Client(
            auth=(
                key_id,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

    @staticmethod
    def amount_to_paise(amount: Decimal) -> int:
        return int(
            (amount * Decimal("100")).quantize(Decimal("1"))
        )

    def create_order(
        self,
        amount: Decimal,
        currency: str,
        receipt: str,
    ) -> dict:
        client = self._get_client()

        amount_paise = self.amount_to_paise(amount)

        return client.order.create(
            data={
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt[:40],
            }
        )

    def fetch_order(self, order_id: str) -> dict:
        client = self._get_client()

        return client.order.fetch(order_id)

    def fetch_order_payments(self, order_id: str) -> dict:
        client = self._get_client()

        return client.order.payments(order_id)

    def fetch_payment(self, payment_id: str) -> dict:
        client = self._get_client()

        return client.payment.fetch(payment_id)

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> None:
        client = self._get_client()

        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )

    @staticmethod
    def verify_webhook_signature(
        payload: bytes,
        signature: str,
    ) -> bool:
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            raise RuntimeError(
                "RAZORPAY_WEBHOOK_SECRET is not configured"
            )

        expected_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(
            expected_signature,
            signature,
        )


razorpay_service = RazorpayService()