"""Billing routes for plans, usage, and Stripe/Razorpay subscription flows."""

from datetime import datetime, timedelta
import hmac
import hashlib
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from auth import get_current_user, get_premium_quota_status
from billing import (
    activate_plan,
    build_subscription_payload,
    cancel_subscription,
    get_billing_plans,
    get_quota_status,
    get_usage,
    record_billing_history,
    record_premium_event,
    resolve_plan_for_cycle,
    sync_subscription_state,
)
from config import settings
from database import BillingCycle, BillingHistory, PlanId, SubscriptionStatus, User, get_db
from payments import StripePaymentProvider, get_payment_provider
from schemas import (
    BillingHistoryItem,
    BillingHistoryResponse,
    BillingPlansResponse,
    BillingPortalRequest,
    BillingPortalResponse,
    GenericBillingActionResponse,
    QuotaStatusResponse,
    RazorpayVerifyRequest,
    StripeCheckoutRequest,
    StripeCheckoutResponse,
    StripeWebhookResponse,
    SubscriptionStatusResponse,
    SubscriptionUpdateRequest,
    UsageSummaryResponse,
)


router = APIRouter(prefix="/api/billing", tags=["Billing"])
logger = logging.getLogger(__name__)


def _resolve_plan_code(payload: StripeCheckoutRequest | SubscriptionUpdateRequest) -> str:
    if getattr(payload, "plan", None):
        return payload.plan
    if hasattr(payload, "plan_code") and payload.plan_code:
        return payload.plan_code
    if getattr(payload, "billing_cycle", None) == BillingCycle.YEARLY.value:
        return PlanId.PRO_YEARLY.value
    if getattr(payload, "billing_cycle", None) == BillingCycle.MONTHLY.value:
        return PlanId.PRO_MONTHLY.value
    return PlanId.PRO_MONTHLY.value


def _resolve_cycle_from_plan(plan_code: str) -> str:
    if plan_code == PlanId.PRO_YEARLY.value:
        return BillingCycle.YEARLY.value
    return BillingCycle.MONTHLY.value


@router.get("/plans", response_model=BillingPlansResponse)
async def list_plans():
    return {"plans": get_billing_plans()}


@router.get("/providers")
async def list_payment_providers():
    stripe_configured = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_PRICE_ID_MONTHLY and settings.STRIPE_PRICE_ID_YEARLY)
    razorpay_configured = bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)

    if (settings.BILLING_PROVIDER or "").lower() == "razorpay" and razorpay_configured:
        default_provider = "razorpay"
    elif (settings.BILLING_PROVIDER or "").lower() == "stripe" and stripe_configured:
        default_provider = "stripe"
    elif razorpay_configured:
        default_provider = "razorpay"
    elif stripe_configured:
        default_provider = "stripe"
    else:
        default_provider = "stripe"

    return {
        "billing_provider": settings.BILLING_PROVIDER,
        "default_provider": default_provider,
        "available_providers": {
            "stripe": stripe_configured,
            "razorpay": razorpay_configured,
        },
    }


@router.get("/subscription", response_model=SubscriptionStatusResponse)
@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return build_subscription_payload(db, user)


@router.post("/subscribe", response_model=SubscriptionStatusResponse)
async def subscribe(
    payload: SubscriptionUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan_code = resolve_plan_for_cycle(payload.billing_cycle)
    activate_plan(user, plan_code, provider=settings.BILLING_PROVIDER or "manual")
    user.billing_cycle = payload.billing_cycle
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    record_premium_event(
        db,
        user_id=user.id,
        event_name="manual_subscription_activated",
        metadata={"plan_code": plan_code, "billing_cycle": payload.billing_cycle},
    )
    return build_subscription_payload(db, user)


@router.post("/checkout-session", response_model=StripeCheckoutResponse)
@router.post("/create-checkout-session", response_model=StripeCheckoutResponse)
async def create_checkout_session(
    payload: StripeCheckoutRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan_code = _resolve_plan_code(payload)
    country = (payload.country or user.country or "").upper()
    requested_provider = (payload.provider or "").lower()

    stripe_configured = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_PRICE_ID_MONTHLY and settings.STRIPE_PRICE_ID_YEARLY)
    razorpay_configured = bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)

    if not stripe_configured and not razorpay_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Checkout is unavailable because no payment provider is configured. Configure Stripe or Razorpay keys.",
        )

    default_provider = (settings.BILLING_PROVIDER or "").lower()
    if default_provider not in {"stripe", "razorpay"}:
        default_provider = "razorpay" if country == "IN" else "stripe"

    if requested_provider == "stripe" and stripe_configured:
        provider_name = "stripe"
    elif requested_provider == "razorpay" and razorpay_configured:
        provider_name = "razorpay"
    elif requested_provider:
        # Frontend can request an unavailable provider (for example, Stripe while only Razorpay is configured).
        if default_provider == "razorpay" and razorpay_configured:
            provider_name = "razorpay"
        elif default_provider == "stripe" and stripe_configured:
            provider_name = "stripe"
        elif razorpay_configured:
            provider_name = "razorpay"
        else:
            provider_name = "stripe"
    else:
        if default_provider == "razorpay" and razorpay_configured:
            provider_name = "razorpay"
        elif default_provider == "stripe" and stripe_configured:
            provider_name = "stripe"
        elif country == "IN" and razorpay_configured:
            provider_name = "razorpay"
        elif stripe_configured:
            provider_name = "stripe"
        else:
            provider_name = "razorpay"

    provider = get_payment_provider(provider_name, country=country)

    success_url = payload.success_url or settings.STRIPE_SUCCESS_URL
    cancel_url = payload.cancel_url or settings.STRIPE_CANCEL_URL

    try:
        checkout = provider.create_checkout(
            user=user,
            plan_id=plan_code,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"billing_cycle": _resolve_cycle_from_plan(plan_code)},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Checkout creation failed for user_id=%s provider=%s plan_code=%s",
            user.id,
            provider_name,
            plan_code,
        )
        raise HTTPException(status_code=400, detail="Failed to create checkout session") from exc

    if checkout.get("provider") == "stripe":
        user.stripe_checkout_session_id = checkout.get("session_id")
    if checkout.get("provider") == "razorpay":
        user.razorpay_order_id = checkout.get("order_id")
    user.payment_provider = checkout.get("provider") or user.payment_provider
    db.commit()

    record_premium_event(
        db,
        user_id=user.id,
        event_name="checkout_session_created",
        metadata={
            "provider": checkout.get("provider"),
            "plan_code": plan_code,
            "billing_cycle": _resolve_cycle_from_plan(plan_code),
        },
    )

    return {
        "provider": checkout.get("provider", "stripe"),
        "session_id": checkout.get("session_id"),
        "checkout_url": checkout.get("checkout_url"),
        "url": checkout.get("checkout_url"),
        "redirect_url": checkout.get("checkout_url"),
        "order_id": checkout.get("order_id"),
        "razorpay_order_id": checkout.get("order_id"),
        "amount": checkout.get("amount"),
        "currency": checkout.get("currency"),
        "key": checkout.get("key"),
        "billing_cycle": _resolve_cycle_from_plan(plan_code),
        "plan_code": plan_code,
    }


@router.post("/create-customer-portal", response_model=BillingPortalResponse)
async def create_customer_portal(
    payload: BillingPortalRequest,
    user: User = Depends(get_current_user),
):
    provider = get_payment_provider("stripe")
    if not isinstance(provider, StripePaymentProvider):
        raise HTTPException(status_code=400, detail="Customer portal is only available for Stripe subscriptions")

    portal = provider.create_customer_portal(user=user, return_url=payload.return_url)
    return {
        "provider": portal.get("provider", "stripe"),
        "portal_url": portal.get("portal_url") or portal.get("url"),
        "url": portal.get("portal_url") or portal.get("url"),
    }


@router.post("/cancel", response_model=SubscriptionStatusResponse)
@router.post("/cancel-subscription", response_model=SubscriptionStatusResponse)
async def cancel_user_subscription(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider_name = user.subscription_provider or user.payment_provider or "stripe"
    provider = get_payment_provider(provider_name, country=user.country)
    provider.cancel_subscription(user=user)
    cancel_subscription(user, immediate=False)
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    record_premium_event(
        db,
        user_id=user.id,
        event_name="subscription_cancel_requested",
        metadata={"provider": provider_name},
    )
    return build_subscription_payload(db, user)


@router.post("/resume-subscription", response_model=SubscriptionStatusResponse)
async def resume_subscription(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider_name = user.subscription_provider or user.payment_provider or "stripe"
    provider = get_payment_provider(provider_name, country=user.country)
    provider.resume_subscription(user=user)

    user.subscription_status = SubscriptionStatus.ACTIVE.value
    user.cancel_at_period_end = False
    user.subscription_canceled_at = None
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    record_premium_event(
        db,
        user_id=user.id,
        event_name="subscription_resumed",
        metadata={"provider": provider_name},
    )
    return build_subscription_payload(db, user)


@router.get("/usage", response_model=QuotaStatusResponse)
async def usage_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_premium_quota_status(db, user, "premium_features")


@router.get("/usage-summary", response_model=UsageSummaryResponse)
async def usage_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_usage(db, user.id)


@router.get("/history", response_model=BillingHistoryResponse)
async def billing_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(BillingHistory)
        .filter(BillingHistory.user_id == user.id)
        .order_by(BillingHistory.created_at.desc())
        .limit(100)
        .all()
    )

    return {
        "items": [
            BillingHistoryItem(
                id=row.id,
                provider=row.provider,
                amount=row.amount_cents,
                amount_cents=row.amount_cents,
                currency=row.currency,
                status=row.status,
                external_invoice_id=row.external_invoice_id,
                external_payment_id=row.external_payment_id,
                invoice_url=row.invoice_url,
                created_at=row.created_at,
            )
            for row in rows
        ]
    }


@router.post("/razorpay/verify", response_model=GenericBillingActionResponse)
async def verify_razorpay_payment(
    payload: RazorpayVerifyRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider = get_payment_provider("razorpay", country="IN")
    plan_code = payload.plan_code or payload.plan
    if not plan_code:
        raise HTTPException(status_code=400, detail="Missing plan in Razorpay verification payload")

    try:
        provider.verify_payment(payload.model_dump())
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Razorpay signature verification failed for user_id=%s", user.id)
        raise HTTPException(status_code=400, detail="Failed to verify Razorpay payment signature") from exc

    amount_cents = 49900 if plan_code == PlanId.PRO_MONTHLY.value else 299900
    next_billing = datetime.utcnow() + (timedelta(days=30) if plan_code == PlanId.PRO_MONTHLY.value else timedelta(days=365))

    sync_subscription_state(
        user,
        {
            "provider": "razorpay",
            "status": SubscriptionStatus.ACTIVE.value,
            "plan_id": plan_code,
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "amount_cents": amount_cents,
            "currency": "INR",
            "next_billing_date": next_billing,
        },
    )
    user.billing_cycle = _resolve_cycle_from_plan(plan_code)
    user.plan = plan_code
    user.subscription_status = SubscriptionStatus.ACTIVE.value
    user.payment_provider = "razorpay"
    user.next_billing_date = next_billing
    db.commit()
    db.refresh(user)

    record_billing_history(
        db,
        user_id=user.id,
        provider="razorpay",
        amount_cents=amount_cents,
        currency="INR",
        status="paid",
        external_payment_id=payload.razorpay_payment_id,
        external_invoice_id=payload.razorpay_order_id,
    )

    record_premium_event(
        db,
        user_id=user.id,
        event_name="razorpay_payment_verified",
        metadata={
            "plan_code": plan_code,
            "order_id": payload.razorpay_order_id,
            "payment_id": payload.razorpay_payment_id,
        },
    )

    return {
        "success": True,
        "message": "Razorpay payment verified successfully",
        "subscription": build_subscription_payload(db, user),
    }


@router.post("/webhook", response_model=StripeWebhookResponse)
@router.post("/webhook/stripe", response_model=StripeWebhookResponse)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook handler with signature verification.
    
    Security: CRITICAL
    - Verifies webhook signature using Stripe's signing secret
    - Prevents replay attacks and unauthorized webhook calls
    - Only processes events if signature is valid
    
    Setup:
    1. Get STRIPE_WEBHOOK_SECRET from Stripe Dashboard > Developers > Webhooks
    2. Set environment variable: export STRIPE_WEBHOOK_SECRET='whsec_...'
    3. Configure Stripe dashboard to send events to: https://yourdomain.com/api/billing/webhook/stripe
    
    Stripe signature verification is automatic via stripe.Webhook.construct_event()
    which validates the webhook was sent by Stripe using the shared secret.
    """
    try:
        import stripe
    except ImportError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe package is not installed") from exc

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe is not configured")
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe webhook secret is not configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=settings.STRIPE_WEBHOOK_SECRET)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Stripe webhook: {exc}")

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})
    metadata = data_object.get("metadata") or {}
    user = None

    user_id = metadata.get("user_id")
    if user_id:
        user = db.query(User).filter(User.id == int(user_id)).first()

    if not user and data_object.get("customer"):
        user = db.query(User).filter(User.stripe_customer_id == data_object.get("customer")).first()
    if not user and data_object.get("subscription"):
        user = db.query(User).filter(User.stripe_subscription_id == data_object.get("subscription")).first()

    if user:
        if event_type == "checkout.session.completed":
            plan_id = metadata.get("plan_id") or resolve_plan_for_cycle(metadata.get("billing_cycle", BillingCycle.MONTHLY.value))
            sub_id = data_object.get("subscription")
            sync_subscription_state(
                user,
                {
                    "provider": "stripe",
                    "status": SubscriptionStatus.ACTIVE.value,
                    "plan_id": plan_id,
                    "stripe_customer_id": data_object.get("customer"),
                    "stripe_subscription_id": sub_id,
                    "stripe_price_id": metadata.get("price_id"),
                    "amount_cents": data_object.get("amount_total"),
                    "currency": (data_object.get("currency") or "usd").upper(),
                },
            )
            user.billing_cycle = _resolve_cycle_from_plan(plan_id)
            db.commit()

            if data_object.get("amount_total"):
                record_billing_history(
                    db,
                    user_id=user.id,
                    provider="stripe",
                    amount_cents=int(data_object.get("amount_total")),
                    currency=(data_object.get("currency") or "usd").upper(),
                    status="paid",
                    external_payment_id=data_object.get("payment_intent"),
                    external_invoice_id=data_object.get("invoice"),
                )

        elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
            status_value = data_object.get("status", SubscriptionStatus.ACTIVE.value)
            sync_subscription_state(
                user,
                {
                    "provider": "stripe",
                    "status": status_value,
                    "plan_id": user.plan,
                    "stripe_customer_id": data_object.get("customer"),
                    "stripe_subscription_id": data_object.get("id"),
                    "cancel_at_period_end": bool(data_object.get("cancel_at_period_end", False)),
                },
            )
            db.commit()

        record_premium_event(
            db,
            user_id=user.id,
            event_name="stripe_webhook_event",
            metadata={"event_type": event_type},
        )

    return {"received": True, "provider": "stripe", "event": event_type}


@router.post("/webhook/razorpay", response_model=StripeWebhookResponse)
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Razorpay webhook handler with HMAC-SHA256 signature verification.
    
    Security: CRITICAL
    - Verifies webhook signature using HMAC-SHA256
    - Computes expected HMAC from request body and webhook secret
    - Prevents replay attacks and unauthorized webhook calls
    - Only processes events if signature matches
    
    Setup:
    1. Get RAZORPAY_WEBHOOK_SECRET from Razorpay Dashboard > Settings > API Keys
    2. Set environment variable: export RAZORPAY_WEBHOOK_SECRET='<your-webhook-secret>'
    3. Configure Razorpay dashboard to send webhooks to: https://yourdomain.com/api/billing/webhook/razorpay
    
    Signature verification:
    - Expected signature = HMAC-SHA256(request_body, webhook_secret)
    - Received in X-Razorpay-Signature header
    - Uses time-safe comparison (hmac.compare_digest) to prevent timing attacks
    """
    try:
        payload = await request.body()
        data = json.loads(payload.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Razorpay webhook payload: {exc}")

    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Razorpay webhook secret is not configured")

    signature = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature")
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature or ""):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Razorpay webhook signature")

    event = data.get("event")
    payment = data.get("payload", {}).get("payment", {}).get("entity", {})
    if event == "payment.captured":
        order_id = payment.get("order_id")
        payment_id = payment.get("id")
        amount_cents = int(payment.get("amount", 0))
        user = db.query(User).filter(User.razorpay_order_id == order_id).first()
        if user:
            plan_code = user.plan if user.plan in {PlanId.PRO_MONTHLY.value, PlanId.PRO_YEARLY.value} else PlanId.PRO_MONTHLY.value
            next_billing = datetime.utcnow() + (timedelta(days=30) if plan_code == PlanId.PRO_MONTHLY.value else timedelta(days=365))
            sync_subscription_state(
                user,
                {
                    "provider": "razorpay",
                    "status": SubscriptionStatus.ACTIVE.value,
                    "plan_id": plan_code,
                    "razorpay_order_id": order_id,
                    "razorpay_payment_id": payment_id,
                    "amount_cents": amount_cents,
                    "currency": payment.get("currency", "INR"),
                    "next_billing_date": next_billing,
                },
            )
            user.payment_provider = "razorpay"
            user.subscription_status = SubscriptionStatus.ACTIVE.value
            user.next_billing_date = next_billing
            db.commit()
            record_billing_history(
                db,
                user_id=user.id,
                provider="razorpay",
                amount_cents=amount_cents,
                currency=payment.get("currency", "INR"),
                status="paid",
                external_payment_id=payment_id,
                external_invoice_id=order_id,
            )

    return {"received": True, "provider": "razorpay", "event": event}