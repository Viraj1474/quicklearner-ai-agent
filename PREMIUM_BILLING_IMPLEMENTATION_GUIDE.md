# Premium Billing Implementation Guide

## 1) Database Migration Snippets

Use these SQL snippets for SQLite/Postgres-style migrations if you are not using Alembic autogenerate.

```sql
-- users table additions
ALTER TABLE users ADD COLUMN plan VARCHAR(30) DEFAULT 'free';
ALTER TABLE users ADD COLUMN payment_provider VARCHAR(40) DEFAULT 'stripe';
ALTER TABLE users ADD COLUMN country VARCHAR(2);
ALTER TABLE users ADD COLUMN trial_ends_at DATETIME;
ALTER TABLE users ADD COLUMN next_billing_date DATETIME;
ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN active_until DATETIME;
ALTER TABLE users ADD COLUMN razorpay_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE users ADD COLUMN razorpay_payment_id VARCHAR(255);
ALTER TABLE users ADD COLUMN last_payment_amount_cents INTEGER;
ALTER TABLE users ADD COLUMN last_payment_currency VARCHAR(10);
ALTER TABLE users ADD COLUMN last_payment_at DATETIME;
```

```sql
CREATE TABLE IF NOT EXISTS user_usage (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  feature_name VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 0,
  usage_date VARCHAR(10) NOT NULL,
  usage_month VARCHAR(7) NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS premium_analytics_events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  event_name VARCHAR(80) NOT NULL,
  event_data JSON,
  created_at DATETIME
);

CREATE TABLE IF NOT EXISTS billing_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider VARCHAR(30) NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(30) NOT NULL,
  external_invoice_id VARCHAR(255),
  external_payment_id VARCHAR(255),
  invoice_url VARCHAR(500),
  created_at DATETIME
);
```

## 2) API Contract Summary

### Public
- `GET /api/billing/plans`

### Authenticated Billing Core
- `GET /api/billing/subscription`
- `GET /api/billing/subscription-status`
- `POST /api/billing/subscribe`
- `POST /api/billing/checkout-session`
- `POST /api/billing/create-checkout-session`
- `POST /api/billing/create-customer-portal`
- `POST /api/billing/cancel`
- `POST /api/billing/cancel-subscription`
- `POST /api/billing/resume-subscription`
- `GET /api/billing/usage`
- `GET /api/billing/usage-summary`
- `GET /api/billing/history`
- `POST /api/billing/razorpay/verify`

### Webhooks
- `POST /api/billing/webhook` (Stripe alias)
- `POST /api/billing/webhook/stripe`
- `POST /api/billing/webhook/razorpay`

## 3) Request Examples

```json
POST /api/billing/create-checkout-session
{
  "billing_cycle": "yearly",
  "provider": "stripe",
  "country": "US",
  "plan_code": "pro_yearly"
}
```

```json
POST /api/billing/create-checkout-session
{
  "billing_cycle": "monthly",
  "provider": "razorpay",
  "country": "IN",
  "plan_code": "pro_monthly"
}
```

```json
POST /api/billing/razorpay/verify
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123",
  "plan_code": "pro_monthly"
}
```

## 4) Folder Structure Added/Updated

- `backend/payments.py` provider abstraction
- `backend/billing.py` plan config, usage logic, events
- `backend/billing_routes.py` provider-aware routes
- `backend/database.py` billing/usage/event models
- `backend/schemas.py` checkout/provider/history schemas
- `frontend/src/components/premium/PaymentMethodSelector.jsx`
- `frontend/src/components/premium/BillingHistory.jsx`

## 5) Implementation Order

1. Apply database migrations and deploy backend models.
2. Configure env vars for Stripe and Razorpay.
3. Deploy backend routes and webhook endpoints.
4. Install Python deps (`stripe`, `razorpay`) and verify startup.
5. Deploy frontend provider selector + checkout integrations.
6. Run Stripe webhook test events and Razorpay verification test flow.
7. Verify subscription activation, cancel/resume, and billing history writes.
8. Enable conversion analytics dashboards from `premium_analytics_events`.
