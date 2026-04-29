"""Billing, plan configuration, usage tracking, and provider sync helpers."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
import logging

from config import settings
from database import (
    UsageQuota,
    BillingHistory,
    BillingCycle,
    PlanId,
    PremiumAnalyticsEvent,
    SubscriptionStatus,
    SubscriptionTier,
    User,
    UserUsage,
)


logger = logging.getLogger(__name__)


PLAN_CONFIG = {
    PlanId.FREE.value: {
        "plan_id": PlanId.FREE.value,
        "display_name": "Free",
        "monthly_price": 0,
        "yearly_price": 0,
        "badge_text": "Starter",
        "features": [
            "Basic AI chat",
            "Core summaries/quizzes/flashcards",
            "Daily usage limits",
        ],
        "daily_limits": {
            "chat": 10,
            "summary": 3,
            "quiz": 3,
            "flashcards": 10,
            "planner": 0,
            "exports": 0,
        },
        "monthly_limits": {
            "chat": 300,
            "summary": 90,
            "quiz": 90,
            "flashcards": 300,
            "planner": 0,
            "exports": 0,
        },
        "stripe_price_ids": {"monthly": None, "yearly": None},
        "razorpay_price_ids": {"monthly": None, "yearly": None},
    },
    PlanId.PRO_MONTHLY.value: {
        "plan_id": PlanId.PRO_MONTHLY.value,
        "display_name": "Pro Monthly",
        "monthly_price": settings.PREMIUM_MONTHLY_PRICE_CENTS,
        "yearly_price": settings.PREMIUM_YEARLY_PRICE_CENTS,
        "badge_text": "Pro",
        "features": [
            "Unlimited chat/summaries/quizzes/flashcards",
            "Long-term session memory",
            "Priority AI fallback",
            "Faster response mode",
            "Export analytics",
            "Advanced study planner",
            "Early access features",
        ],
        "daily_limits": {
            "chat": None,
            "summary": None,
            "quiz": None,
            "flashcards": None,
            "planner": None,
            "exports": None,
        },
        "monthly_limits": {
            "chat": None,
            "summary": None,
            "quiz": None,
            "flashcards": None,
            "planner": None,
            "exports": None,
        },
        "stripe_price_ids": {
            "monthly": settings.STRIPE_MONTHLY_PRICE_ID,
            "yearly": settings.STRIPE_YEARLY_PRICE_ID,
        },
        "razorpay_price_ids": {
            "monthly": "inr_499_monthly",
            "yearly": "inr_2999_yearly",
        },
    },
    PlanId.PRO_YEARLY.value: {
        "plan_id": PlanId.PRO_YEARLY.value,
        "display_name": "Pro Yearly",
        "monthly_price": settings.PREMIUM_MONTHLY_PRICE_CENTS,
        "yearly_price": settings.PREMIUM_YEARLY_PRICE_CENTS,
        "badge_text": "Most Popular",
        "features": [
            "Everything in Pro Monthly",
            "Yearly discount pricing",
            "Priority roadmap features",
        ],
        "daily_limits": {
            "chat": None,
            "summary": None,
            "quiz": None,
            "flashcards": None,
            "planner": None,
            "exports": None,
        },
        "monthly_limits": {
            "chat": None,
            "summary": None,
            "quiz": None,
            "flashcards": None,
            "planner": None,
            "exports": None,
        },
        "stripe_price_ids": {
            "monthly": settings.STRIPE_MONTHLY_PRICE_ID,
            "yearly": settings.STRIPE_YEARLY_PRICE_ID,
        },
        "razorpay_price_ids": {
            "monthly": "inr_499_monthly",
            "yearly": "inr_2999_yearly",
        },
    },
    PlanId.TEAM.value: {
        "plan_id": PlanId.TEAM.value,
        "display_name": "Team",
        "monthly_price": 0,
        "yearly_price": 0,
        "badge_text": "Coming Soon",
        "features": ["Future multi-user plan"],
        "daily_limits": {
            "chat": None,
            "summary": None,
            "quiz": None,
            "flashcards": None,
            "planner": None,
            "exports": None,
        },
        "monthly_limits": {
            "chat": None,
            "summary": None,
            "quiz": None,
            "flashcards": None,
            "planner": None,
            "exports": None,
        },
        "stripe_price_ids": {"monthly": None, "yearly": None},
        "razorpay_price_ids": {"monthly": None, "yearly": None},
    },
}


def _format_price(price_cents: int) -> str:
    return f"${price_cents / 100:.2f}"


def _inr_format(price_paise: int) -> str:
    return f"\u20b9{price_paise / 100:.2f}"


def get_billing_plans() -> list[dict]:
    """Public catalog used by pricing cards and plan comparison."""
    yearly_savings = settings.YEARLY_DISCOUNT_PERCENT
    return [
        {
            "plan_code": PlanId.FREE.value,
            "billing_cycle": None,
            "name": "Free",
            "description": "Great for getting started.",
            "price_cents": 0,
            "price_display": "$0.00",
            "currency": "USD",
            "interval": None,
            "features": PLAN_CONFIG[PlanId.FREE.value]["features"],
            "recommended": False,
            "badge_text": PLAN_CONFIG[PlanId.FREE.value]["badge_text"],
        },
        {
            "plan_code": PlanId.PRO_MONTHLY.value,
            "billing_cycle": BillingCycle.MONTHLY.value,
            "name": "Pro Monthly",
            "description": "Unlimited daily usage and premium tools.",
            "price_cents": PLAN_CONFIG[PlanId.PRO_MONTHLY.value]["monthly_price"],
            "price_display": _format_price(PLAN_CONFIG[PlanId.PRO_MONTHLY.value]["monthly_price"]),
            "currency": "USD",
            "interval": "month",
            "features": PLAN_CONFIG[PlanId.PRO_MONTHLY.value]["features"],
            "recommended": False,
            "badge_text": PLAN_CONFIG[PlanId.PRO_MONTHLY.value]["badge_text"],
        },
        {
            "plan_code": PlanId.PRO_YEARLY.value,
            "billing_cycle": BillingCycle.YEARLY.value,
            "name": "Pro Yearly",
            "description": "Best value with yearly savings.",
            "price_cents": PLAN_CONFIG[PlanId.PRO_YEARLY.value]["yearly_price"],
            "price_display": _format_price(PLAN_CONFIG[PlanId.PRO_YEARLY.value]["yearly_price"]),
            "currency": "USD",
            "interval": "year",
            "features": PLAN_CONFIG[PlanId.PRO_YEARLY.value]["features"],
            "recommended": True,
            "savings_percent": yearly_savings,
            "badge_text": PLAN_CONFIG[PlanId.PRO_YEARLY.value]["badge_text"],
        },
    ]


def get_plan(plan_id: str) -> dict:
    if plan_id not in PLAN_CONFIG:
        raise ValueError(f"Unsupported plan id: {plan_id}")
    return PLAN_CONFIG[plan_id]


def resolve_plan_for_cycle(cycle: str) -> str:
    if cycle == BillingCycle.MONTHLY.value:
        return PlanId.PRO_MONTHLY.value
    if cycle == BillingCycle.YEARLY.value:
        return PlanId.PRO_YEARLY.value
    raise ValueError(f"Unsupported billing cycle: {cycle}")


def has_premium_access(user: User) -> bool:
    """Return True when the user can access premium-only features."""
    if not user:
        return False

    role = (getattr(user, "role", "") or "").lower()
    if role in {"developer", "admin"}:
        return True

    plan = (getattr(user, "plan", "") or "").lower()
    status = (
        getattr(user, "subscriptionstatus", None)
        or getattr(user, "subscription_status", None)
        or ""
    ).lower()

    allowed_plans = {
        "monthly",
        "yearly",
        PlanId.PRO_MONTHLY.value,
        PlanId.PRO_YEARLY.value,
    }
    if plan not in allowed_plans or status != SubscriptionStatus.ACTIVE.value:
        return False

    # Guard against stale status records when an end date has already passed.
    if getattr(user, "active_until", None) and user.active_until < datetime.utcnow():
        return False
    if getattr(user, "subscription_ends_at", None) and user.subscription_ends_at < datetime.utcnow():
        return False

    return True


def is_premium_active(user: User) -> bool:
    return has_premium_access(user)


def get_user_plan_id(user: User) -> str:
    return user.plan or PlanId.FREE.value


def activate_plan(user: User, plan_id: str, provider: str, trial_days: int = 0) -> None:
    now = datetime.utcnow()
    if plan_id == PlanId.PRO_MONTHLY.value:
        end_at = now + timedelta(days=30)
    elif plan_id == PlanId.PRO_YEARLY.value:
        end_at = now + timedelta(days=365)
    elif plan_id == PlanId.FREE.value:
        end_at = None
    else:
        end_at = now + timedelta(days=365)

    if trial_days > 0:
        user.trial_ends_at = now + timedelta(days=trial_days)

    user.plan = plan_id
    user.subscription_tier = SubscriptionTier.PREMIUM.value if plan_id != PlanId.FREE.value else SubscriptionTier.FREE.value
    user.subscription_status = SubscriptionStatus.ACTIVE.value if plan_id != PlanId.FREE.value else SubscriptionStatus.FREE.value
    user.subscription_provider = provider
    user.subscription_started_at = now if plan_id != PlanId.FREE.value else None
    user.subscription_ends_at = end_at
    user.active_until = end_at
    user.next_billing_date = end_at
    user.cancel_at_period_end = False
    user.subscription_canceled_at = None
    user.updated_at = now


def downgrade_to_free(user: User) -> None:
    now = datetime.utcnow()
    user.plan = PlanId.FREE.value
    user.subscription_tier = SubscriptionTier.FREE.value
    user.subscription_status = SubscriptionStatus.FREE.value
    user.subscription_provider = None
    user.subscription_started_at = None
    user.subscription_ends_at = None
    user.active_until = None
    user.next_billing_date = None
    user.cancel_at_period_end = False
    user.subscription_canceled_at = now
    user.updated_at = now


def increment_usage(db, user_id: int, feature_name: str) -> dict:
    """Increment daily/monthly counters for a user feature."""
    usage_date = datetime.utcnow().date().isoformat()
    usage_month = datetime.utcnow().strftime("%Y-%m")
    usage = (
        db.query(UserUsage)
        .filter(
            UserUsage.user_id == user_id,
            UserUsage.feature_name == feature_name,
            UserUsage.usage_date == usage_date,
        )
        .first()
    )

    if usage is None:
        usage = UserUsage(
            user_id=user_id,
            feature_name=feature_name,
            usage_date=usage_date,
            usage_month=usage_month,
            count=0,
        )
        db.add(usage)

    usage.count += 1
    usage.usage_month = usage_month
    usage.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(usage)
    return {
        "feature": feature_name,
        "count": usage.count,
        "date": usage.usage_date,
        "month": usage.usage_month,
    }


def get_usage(db, user_id: int) -> dict:
    """Return usage buckets for today and current month."""
    today = datetime.utcnow().date().isoformat()
    month = datetime.utcnow().strftime("%Y-%m")

    daily_rows = db.query(UserUsage).filter(UserUsage.user_id == user_id, UserUsage.usage_date == today).all()
    month_rows = db.query(UserUsage).filter(UserUsage.user_id == user_id, UserUsage.usage_month == month).all()

    daily = {}
    monthly = {}
    for row in daily_rows:
        daily[row.feature_name] = daily.get(row.feature_name, 0) + row.count
    for row in month_rows:
        monthly[row.feature_name] = monthly.get(row.feature_name, 0) + row.count

    return {
        "date": today,
        "month": month,
        "daily": daily,
        "monthly": monthly,
    }


def can_use_feature(db, user: User, feature_name: str) -> tuple[bool, dict]:
    """Check whether user can use a feature under current plan and usage."""
    plan = get_plan(get_user_plan_id(user))
    if is_premium_active(user) and get_user_plan_id(user) != PlanId.FREE.value:
        return True, {"feature": feature_name, "unlimited": True}

    usage = get_usage(db, user.id)
    daily_count = usage["daily"].get(feature_name, 0)
    monthly_count = usage["monthly"].get(feature_name, 0)

    daily_limit = plan["daily_limits"].get(feature_name)
    monthly_limit = plan["monthly_limits"].get(feature_name)

    if daily_limit is not None and daily_count >= daily_limit:
        return False, {
            "error": "quota_exceeded",
            "feature": feature_name,
            "message": f"You have reached your free daily {feature_name} limit.",
            "upgrade_required": True,
            "upgrade_url": "/pricing",
            "daily_limit": daily_limit,
            "used": daily_count,
        }

    if monthly_limit is not None and monthly_count >= monthly_limit:
        return False, {
            "error": "quota_exceeded",
            "feature": feature_name,
            "message": f"You have reached your free monthly {feature_name} limit.",
            "upgrade_required": True,
            "upgrade_url": "/pricing",
            "monthly_limit": monthly_limit,
            "used": monthly_count,
        }

    return True, {
        "feature": feature_name,
        "daily_limit": daily_limit,
        "monthly_limit": monthly_limit,
        "daily_used": daily_count,
        "monthly_used": monthly_count,
    }


def get_quota_status(db, user: User, feature_name: str) -> dict:
    plan = get_plan(get_user_plan_id(user))
    usage = get_usage(db, user.id)
    daily_used = usage["daily"].get(feature_name, 0)
    monthly_used = usage["monthly"].get(feature_name, 0)
    daily_limit = plan["daily_limits"].get(feature_name)
    monthly_limit = plan["monthly_limits"].get(feature_name)

    return {
        "feature": feature_name,
        "usage_date": usage["date"],
        "usage_month": usage["month"],
        "daily_limit": daily_limit,
        "used_count": daily_used,
        "remaining_count": None if daily_limit is None else max(daily_limit - daily_used, 0),
        "monthly_limit": monthly_limit,
        "monthly_used": monthly_used,
        "is_exhausted": False if daily_limit is None else daily_used >= daily_limit,
        "is_premium": is_premium_active(user),
        "unlimited": daily_limit is None,
    }


def build_subscription_payload(db, user: User) -> dict:
    """Public subscription response with plan and usage context."""
    plan_id = get_user_plan_id(user)
    plan_cfg = get_plan(plan_id)

    plan_payload = {
        "plan_code": plan_id,
        "billing_cycle": user.billing_cycle,
        "name": plan_cfg["display_name"],
        "description": "Premium plan" if plan_id != PlanId.FREE.value else "Free starter plan",
        "price_cents": plan_cfg["monthly_price"] if user.billing_cycle == BillingCycle.MONTHLY.value else plan_cfg["yearly_price"],
        "price_display": _format_price(plan_cfg["monthly_price"] if user.billing_cycle == BillingCycle.MONTHLY.value else plan_cfg["yearly_price"]),
        "currency": "USD",
        "interval": user.billing_cycle,
        "features": plan_cfg["features"],
        "recommended": plan_id == PlanId.PRO_YEARLY.value,
        "badge_text": plan_cfg["badge_text"],
    }

    usage = get_usage(db, user.id)
    usage_rows = []
    for feature in ["chat", "summary", "quiz", "flashcards", "planner", "exports"]:
        q = get_quota_status(db, user, feature)
        usage_rows.append(q)

    return {
        "user": user,
        "is_premium": is_premium_active(user),
        "subscription_tier": user.subscription_tier or SubscriptionTier.FREE.value,
        "billing_cycle": user.billing_cycle,
        "status": user.subscription_status or SubscriptionStatus.FREE.value,
        "started_at": user.subscription_started_at,
        "ends_at": user.subscription_ends_at,
        "canceled_at": user.subscription_canceled_at,
        "provider": user.subscription_provider,
        "plan": plan_payload,
        "quota": get_quota_status(db, user, "chat"),
        "usage": usage,
        "usage_by_feature": usage_rows,
        "next_billing_date": user.next_billing_date,
        "cancel_at_period_end": user.cancel_at_period_end,
        "active_until": user.active_until,
    }


def activate_subscription(user: User, billing_cycle: str, provider: str = "stripe") -> dict:
    """Compatibility helper used by older route handlers."""
    plan_id = resolve_plan_for_cycle(billing_cycle)
    activate_plan(user, plan_id=plan_id, provider=provider, trial_days=settings.DEFAULT_TRIAL_DAYS)
    user.billing_cycle = billing_cycle
    return {
        "is_premium": True,
        "subscription_tier": user.subscription_tier,
        "billing_cycle": user.billing_cycle,
        "status": user.subscription_status,
    }


def cancel_subscription(user: User, immediate: bool = False) -> dict:
    """Compatibility helper used by older route handlers."""
    if immediate:
        downgrade_to_free(user)
    else:
        user.cancel_at_period_end = True
        user.subscription_status = SubscriptionStatus.CANCELED.value
        user.subscription_canceled_at = datetime.utcnow()
    return {
        "is_premium": is_premium_active(user),
        "subscription_tier": user.subscription_tier,
        "billing_cycle": user.billing_cycle,
        "status": user.subscription_status,
        "cancel_at_period_end": user.cancel_at_period_end,
    }


def get_daily_quota_status(db, user_id: int, usage_scope: str) -> dict:
    """Legacy daily quota status for existing auth middleware."""
    today = datetime.utcnow().date().isoformat()
    row = (
        db.query(UsageQuota)
        .filter(
            UsageQuota.user_id == user_id,
            UsageQuota.usage_scope == usage_scope,
            UsageQuota.usage_date == today,
        )
        .first()
    )
    used = row.used_count if row else 0
    limit = settings.FREE_PREMIUM_DAILY_QUOTA
    remaining = max(limit - used, 0)
    return {
        "usage_scope": usage_scope,
        "usage_date": today,
        "daily_limit": limit,
        "used_count": used,
        "remaining_count": remaining,
        "is_exhausted": used >= limit,
    }


def consume_daily_quota(db, user_id: int, usage_scope: str) -> dict:
    """Legacy daily quota consumption for existing auth middleware."""
    status = get_daily_quota_status(db, user_id, usage_scope)
    if status["is_exhausted"]:
        return {"allowed": False, **status}

    today = status["usage_date"]
    row = (
        db.query(UsageQuota)
        .filter(
            UsageQuota.user_id == user_id,
            UsageQuota.usage_scope == usage_scope,
            UsageQuota.usage_date == today,
        )
        .first()
    )
    if row is None:
        row = UsageQuota(
            user_id=user_id,
            usage_scope=usage_scope,
            usage_date=today,
            used_count=0,
        )
        db.add(row)

    row.used_count += 1
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)

    updated = get_daily_quota_status(db, user_id, usage_scope)
    return {
        "allowed": True,
        **updated,
    }


def record_premium_event(db, user_id: Optional[int], event_name: str, metadata: Optional[dict] = None) -> None:
    try:
        event = PremiumAnalyticsEvent(
            user_id=user_id,
            event_name=event_name,
            event_data=metadata or {},
        )
        db.add(event)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning("Skipping premium analytics event due to DB schema/state issue: %s", exc)


def record_billing_history(
    db,
    user_id: int,
    provider: str,
    amount_cents: int,
    currency: str,
    status: str,
    external_invoice_id: Optional[str] = None,
    external_payment_id: Optional[str] = None,
    invoice_url: Optional[str] = None,
) -> BillingHistory:
    try:
        row = BillingHistory(
            user_id=user_id,
            provider=provider,
            amount_cents=amount_cents,
            currency=currency,
            status=status,
            external_invoice_id=external_invoice_id,
            external_payment_id=external_payment_id,
            invoice_url=invoice_url,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except Exception as exc:
        db.rollback()
        logger.warning("Skipping billing history write due to DB schema/state issue: %s", exc)
        return None


def sync_subscription_state(user: User, provider_payload: dict) -> None:
    """Shared state updater used by Stripe and Razorpay webhooks."""
    provider = (provider_payload.get("provider") or user.payment_provider or "stripe").lower()
    plan_id = provider_payload.get("plan_id") or user.plan or PlanId.FREE.value

    if provider_payload.get("status") in {"canceled", "cancelled", "expired"}:
        downgrade_to_free(user)
        return

    trial_days = provider_payload.get("trial_days", 0)
    activate_plan(user, plan_id=plan_id, provider=provider, trial_days=trial_days)

    user.payment_provider = provider
    user.subscription_provider = provider
    user.subscription_status = provider_payload.get("status", SubscriptionStatus.ACTIVE.value)
    user.cancel_at_period_end = bool(provider_payload.get("cancel_at_period_end", False))
    user.next_billing_date = provider_payload.get("next_billing_date") or user.next_billing_date
    user.active_until = provider_payload.get("active_until") or user.active_until

    if provider == "stripe":
        user.stripe_customer_id = provider_payload.get("stripe_customer_id") or user.stripe_customer_id
        user.stripe_subscription_id = provider_payload.get("stripe_subscription_id") or user.stripe_subscription_id
        user.stripe_price_id = provider_payload.get("stripe_price_id") or user.stripe_price_id
    if provider == "razorpay":
        user.razorpay_customer_id = provider_payload.get("razorpay_customer_id") or user.razorpay_customer_id
        user.razorpay_order_id = provider_payload.get("razorpay_order_id") or user.razorpay_order_id
        user.razorpay_payment_id = provider_payload.get("razorpay_payment_id") or user.razorpay_payment_id

    if provider_payload.get("amount_cents"):
        user.last_payment_amount_cents = provider_payload.get("amount_cents")
        user.last_payment_currency = provider_payload.get("currency", user.last_payment_currency or "USD")
        user.last_payment_at = datetime.utcnow()

    user.updated_at = datetime.utcnow()
