"""Payment provider abstraction for Stripe and Razorpay."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
import logging

from fastapi import HTTPException, status

from config import settings


logger = logging.getLogger(__name__)


class PaymentProvider(ABC):
    """Common interface for payment providers."""

    @abstractmethod
    def create_checkout(self, *, user, plan_id: str, success_url: str, cancel_url: str, metadata: dict | None = None) -> dict:
        raise NotImplementedError

    @abstractmethod
    def verify_payment(self, payload: dict) -> dict:
        raise NotImplementedError

    @abstractmethod
    def cancel_subscription(self, *, user) -> dict:
        raise NotImplementedError

    @abstractmethod
    def resume_subscription(self, *, user) -> dict:
        raise NotImplementedError


class StripePaymentProvider(PaymentProvider):
    """Stripe-backed subscription checkout and lifecycle operations."""

    def _client(self):
        try:
            import stripe
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe package is not installed",
            ) from exc

        if not settings.STRIPE_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe is not configured",
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY
        return stripe

    def _resolve_price_id(self, plan_id: str) -> str:
        if plan_id == "pro_yearly":
            return settings.STRIPE_PRICE_ID_YEARLY
        return settings.STRIPE_PRICE_ID_MONTHLY

    def create_checkout(self, *, user, plan_id: str, success_url: str, cancel_url: str, metadata: dict | None = None) -> dict:
        stripe = self._client()

        price_id = self._resolve_price_id(plan_id)

        if not price_id:
            raise HTTPException(status_code=400, detail=f"No Stripe price configured for plan {plan_id}")

        payload_metadata = {
            "user_id": str(user.id),
            "plan_id": plan_id,
            **(metadata or {}),
        }

        params = {
            "mode": "subscription",
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": payload_metadata,
            "subscription_data": {"metadata": payload_metadata},
        }
        if settings.DEFAULT_TRIAL_DAYS > 0:
            params["subscription_data"]["trial_period_days"] = settings.DEFAULT_TRIAL_DAYS

        if user.stripe_customer_id:
            params["customer"] = user.stripe_customer_id
        else:
            params["customer_email"] = user.email

        session = stripe.checkout.Session.create(**params)
        return {
            "provider": "stripe",
            "session_id": session.id,
            "checkout_url": session.url,
            "price_id": price_id,
        }

    def create_checkout_session(self, plan: str, user, success_url: str | None = None, cancel_url: str | None = None) -> dict:
        """Backward-compatible helper used by route handlers."""
        return self.create_checkout(
            user=user,
            plan_id=plan,
            success_url=success_url or settings.STRIPE_SUCCESS_URL,
            cancel_url=cancel_url or settings.STRIPE_CANCEL_URL,
        )

    def verify_payment(self, payload: dict) -> dict:
        # Stripe verification is handled by webhook signatures.
        return {"provider": "stripe", "verified": True, "payload": payload}

    def cancel_subscription(self, *, user) -> dict:
        if not user.stripe_subscription_id:
            return {"provider": "stripe", "status": "no_subscription"}

        stripe = self._client()
        sub = stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=True)
        return {
            "provider": "stripe",
            "status": "cancel_at_period_end",
            "cancel_at_period_end": bool(getattr(sub, "cancel_at_period_end", True)),
        }

    def resume_subscription(self, *, user) -> dict:
        if not user.stripe_subscription_id:
            raise HTTPException(status_code=400, detail="No Stripe subscription to resume")

        stripe = self._client()
        sub = stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=False)
        return {
            "provider": "stripe",
            "status": getattr(sub, "status", "active"),
            "cancel_at_period_end": bool(getattr(sub, "cancel_at_period_end", False)),
        }

    def create_customer_portal(self, *, user, return_url: Optional[str] = None) -> dict:
        if not user.stripe_customer_id:
            raise HTTPException(status_code=400, detail="Stripe customer is not available for this user")

        stripe = self._client()
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url or settings.STRIPE_PORTAL_RETURN_URL,
        )
        return {
            "provider": "stripe",
            "portal_url": session.url,
        }

    def create_checkout_alias(self, plan: str, user) -> dict:
        return self.create_checkout_session(plan, user)


class RazorpayPaymentProvider(PaymentProvider):
    """Razorpay order-based checkout for India-local payment methods."""

    def _client(self):
        try:
            import razorpay
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay package is not installed",
            ) from exc

        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay is not configured",
            )

        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    def create_checkout(self, *, user, plan_id: str, success_url: str, cancel_url: str, metadata: dict | None = None) -> dict:
        client = self._client()
        amount_in_paise = (
            settings.RAZORPAY_MONTHLY_PRICE_PAISE
            if plan_id == "pro_monthly"
            else settings.RAZORPAY_YEARLY_PRICE_PAISE
        )

        try:
            order = client.order.create(
                {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "payment_capture": 1,
                    "notes": {
                        "user_id": str(user.id),
                        "plan_id": plan_id,
                        **(metadata or {}),
                    },
                }
            )
        except Exception as exc:
            logger.exception("Failed to create Razorpay order for user_id=%s plan_id=%s", user.id, plan_id)
            raise HTTPException(
                status_code=400,
                detail="Failed to create Razorpay order. Check Razorpay keys.",
            ) from exc

        return {
            "provider": "razorpay",
            "order_id": order.get("id"),
            "amount": amount_in_paise,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID,
            "plan_id": plan_id,
        }

    def create_checkout_session(self, plan: str, user, success_url: str | None = None, cancel_url: str | None = None) -> dict:
        return self.create_checkout(
            user=user,
            plan_id=plan,
            success_url=success_url or settings.STRIPE_SUCCESS_URL,
            cancel_url=cancel_url or settings.STRIPE_CANCEL_URL,
        )

    def verify_payment(self, payload: dict) -> dict:
        import hmac
        import hashlib

        order_id = payload.get("razorpay_order_id")
        payment_id = payload.get("razorpay_payment_id")
        signature = payload.get("razorpay_signature")
        message = f"{order_id}|{payment_id}".encode("utf-8")
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(generated_signature, signature or ""):
            logger.warning("Invalid Razorpay signature for order_id=%s payment_id=%s", order_id, payment_id)
            raise HTTPException(status_code=400, detail="Invalid Razorpay signature")
        return {
            "provider": "razorpay",
            "verified": True,
            "order_id": order_id,
            "payment_id": payment_id,
            "verified_at": datetime.utcnow().isoformat(),
        }

    def cancel_subscription(self, *, user) -> dict:
        # Local order flow does not have recurring subscription by default.
        return {"provider": "razorpay", "status": "manual_cancel_required"}

    def resume_subscription(self, *, user) -> dict:
        return {"provider": "razorpay", "status": "manual_resume_required"}

    def create_customer_portal(self, *, user, return_url: Optional[str] = None) -> dict:
        raise HTTPException(status_code=400, detail="Customer portal is not available for Razorpay")

    def create_checkout_alias(self, plan: str, user) -> dict:
        return self.create_checkout_session(plan, user)


def get_payment_provider(provider: Optional[str], country: Optional[str] = None) -> PaymentProvider:
    """Resolve provider choice, defaulting to Razorpay for India and Stripe elsewhere."""
    normalized_provider = (provider or "").strip().lower()
    normalized_country = (country or "").strip().upper()

    if normalized_provider == "razorpay" or (not normalized_provider and normalized_country == "IN"):
        return RazorpayPaymentProvider()
    return StripePaymentProvider()
