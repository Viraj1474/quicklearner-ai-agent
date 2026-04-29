-- Premium billing schema migration
-- Safe to run multiple times in SQLite and PostgreSQL-style migration runners that support IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS billing_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    external_payment_id VARCHAR(255),
    external_invoice_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premium_analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_name VARCHAR(128) NOT NULL,
    event_source VARCHAR(64) NOT NULL DEFAULT 'billing',
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    summary_requests INTEGER NOT NULL DEFAULT 0,
    quiz_requests INTEGER NOT NULL DEFAULT 0,
    highlight_requests INTEGER NOT NULL DEFAULT 0,
    chat_requests INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    credits_reset_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN plan VARCHAR(32) DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(32) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN payment_provider VARCHAR(32);
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_price_id VARCHAR(255);
ALTER TABLE users ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE users ADD COLUMN razorpay_payment_id VARCHAR(255);
ALTER TABLE users ADD COLUMN next_billing_date DATETIME;
ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN subscription_started_at DATETIME;
ALTER TABLE users ADD COLUMN subscription_ends_at DATETIME;
