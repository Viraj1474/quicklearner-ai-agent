# Production Deployment Setup Guide

## ⚠️ CRITICAL SECURITY REQUIREMENTS

These settings **MUST** be configured before deploying to production. The application will fail to start if any of these are missing or incorrect.

### 1. SECRET_KEY (Authentication & Session Encryption)

**REQUIREMENT**: Must be a strong random string (64+ characters minimum)

```bash
# Generate a strong secret key:
python -c 'import secrets; print(secrets.token_urlsafe(64))'

# Output example:
# Jc3Kp9lQ5mN7xY2zW6vU8bT4sR1dF0hG9jK2lM5nP8qS3uV6wX1yZ4aC7bD0eF...

# Set in environment:
export SECRET_KEY='your-generated-64-char-string'
```

**⚠️ FATAL**: The application will crash if:
- SECRET_KEY uses the default `dev-*` prefix
- SECRET_KEY is empty or missing in production
- SECRET_KEY is weak (less than 64 characters)

### 2. ALLOWED_DEVELOPER_EMAILS (Admin Access)

**REQUIREMENT**: Must be explicitly set in production (no defaults)

```bash
# Comma-separated list of admin email addresses
export ALLOWED_DEVELOPER_EMAILS='admin@yourdomain.com,ops@yourdomain.com'
```

**⚠️ FATAL**: The application will crash if:
- ALLOWED_DEVELOPER_EMAILS is empty in production
- Only the default email is configured

### 3. ALLOWED_ORIGIN (CORS Domain)

**REQUIREMENT**: Must be your exact production frontend domain

```bash
# Single domain (recommended):
export ALLOWED_ORIGIN='https://yourdomain.com'

# Multiple domains (comma-separated):
export ALLOWED_ORIGIN='https://yourdomain.com,https://app.yourdomain.com'
```

**⚠️ SECURITY RISK**: 
- Never use wildcard (`*`) in production
- Never allow `http://` only in production (always use HTTPS)
- Must include the exact protocol and domain

### 4. DEBUG Mode

**REQUIREMENT**: Must be False in production

```bash
export DEBUG='False'
```

**⚠️ FATAL**: The application will crash if DEBUG=True in production

Reason: Debug mode exposes internal stack traces and sensitive system information via `/docs` and error pages.

---

## 🔑 API Keys

### Google Gemini API

```bash
export GEMINI_API_KEY='your-production-api-key'
```

- Generate at: https://ai.google.dev/
- Use a production API key with quota limits configured
- Never commit API keys to version control

### Stripe (Optional - for payment processing)

```bash
# Production keys (sk_live_*, never sk_test_*)
export STRIPE_SECRET_KEY='sk_live_...'
export STRIPE_WEBHOOK_SECRET='whsec_...'
export STRIPE_PRICE_ID_MONTHLY='price_...'
export STRIPE_PRICE_ID_YEARLY='price_...'
```

**Setup**:
1. Create Stripe account at https://stripe.com
2. Get API keys from Stripe Dashboard > Developers > API keys
3. Configure webhook at Stripe Dashboard > Developers > Webhooks
4. Point webhook to: `https://yourdomain.com/api/billing/webhook`

### Razorpay (Alternative payment provider)

```bash
# Production keys (rzp_live_*, never rzp_test_*)
export RAZORPAY_KEY_ID='rzp_live_...'
export RAZORPAY_KEY_SECRET='your-secret'
export RAZORPAY_WEBHOOK_SECRET='your-webhook-secret'
```

**Setup**:
1. Create Razorpay account at https://razorpay.com
2. Get API keys from Razorpay Dashboard > Settings > API Keys
3. Configure webhook at Razorpay Dashboard > Settings > Webhooks
4. Point webhook to: `https://yourdomain.com/api/billing/webhook/razorpay`

---

## 🗄️ Database Configuration

### SQLite (Current - Limited for Production)

```bash
DATABASE_URL='sqlite:///C:/path/to/backend/ai_agent.db'
```

**Limitations**:
- Single-writer constraint (only one process can write at a time)
- Limited concurrent access
- Not suitable for high-traffic production

**Backup Strategy**:
```bash
# Run daily backup via cron job
python backend/backup_db.py --max-backups=14
```

### PostgreSQL (Recommended for Production)

```bash
export DATABASE_URL='postgresql+psycopg2://user:password@db-host:5432/ai_agent'
```

**Installation**:
```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Create database
psql -U postgres -c "CREATE DATABASE ai_agent;"

# Set permissions
psql -U postgres -c "ALTER DATABASE ai_agent OWNER TO your_user;"
```

---

## 📧 Email Configuration (Optional)

For password reset and verification emails:

```bash
export SMTP_HOST='smtp.gmail.com'
export SMTP_PORT='587'
export SMTP_USER='your-email@gmail.com'
export SMTP_PASSWORD='your-app-password'  # 16-char app password, not your actual Gmail password
export SMTP_FROM_EMAIL='noreply@yourdomain.com'
export SMTP_FROM_NAME='Your App Name'
```

**Gmail Setup**:
1. Enable 2-Factor Authentication
2. Create App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character app password (not your Gmail password)

---

## 🔐 Webhook Verification

### Stripe Webhook Security

The backend automatically verifies Stripe webhook signatures using `stripe.Webhook.construct_event()`:

```python
# The library verifies that:
# 1. The webhook signature header matches
# 2. The request body hasn't been tampered with
# 3. The webhook timestamp is recent (prevents replay attacks)
```

### Razorpay Webhook Security

The backend automatically verifies Razorpay webhook signatures using HMAC-SHA256:

```python
import hmac
import hashlib

# Verification:
expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
received = headers.get('X-Razorpay-Signature')
assert hmac.compare_digest(expected, received)  # Time-safe comparison
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] **SECRET_KEY**: Generated via `secrets.token_urlsafe(64)` and set in environment
- [ ] **ENVIRONMENT**: Set to `production`
- [ ] **DEBUG**: Set to `False`
- [ ] **ALLOWED_DEVELOPER_EMAILS**: Explicitly configured (not using defaults)
- [ ] **ALLOWED_ORIGIN**: Set to your production domain (not wildcard)
- [ ] **GEMINI_API_KEY**: Valid production API key configured
- [ ] **Database**: Migrated to PostgreSQL or SQLite backups configured
- [ ] **Stripe/Razorpay**: Webhook secrets configured and tested
- [ ] **SMTP**: Email configured for production (if needed)
- [ ] **HTTPS**: Enforced via reverse proxy (Nginx/Apache with SSL)
- [ ] **SSL/TLS**: Valid certificates (not self-signed)
- [ ] **Rate Limiting**: Appropriate for your expected traffic
- [ ] **Logs**: Monitoring configured for errors/warnings
- [ ] **Backups**: Database backup strategy in place
- [ ] **Monitoring**: Health checks and alerting configured

---

## 🔄 HTTPS Setup (Reverse Proxy)

The backend includes HTTPS redirect middleware, but requires a reverse proxy to handle SSL/TLS:

### Nginx Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

## 📋 Environment Variables Summary

### Critical (Application won't start without these in production)
- `ENVIRONMENT=production`
- `DEBUG=False`
- `SECRET_KEY=<64-char-random-string>`
- `ALLOWED_DEVELOPER_EMAILS=admin@yourdomain.com`
- `ALLOWED_ORIGIN=https://yourdomain.com`

### Required
- `GEMINI_API_KEY=<your-api-key>`

### Recommended
- `DATABASE_URL=postgresql://...` (or SQLite with backups)
- `STRIPE_SECRET_KEY=sk_live_...` or `RAZORPAY_KEY_ID=rzp_live_...`
- `SMTP_*` configuration

### Optional
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (for OAuth)
- `HUGGINGFACE_API_KEY` (fallback provider)

---

## ❌ Common Deployment Mistakes

1. **Using test API keys in production** (e.g., `sk_test_*`, `rzp_test_*`)
   - Result: Payments will fail in production

2. **Forgetting to set ALLOWED_ORIGIN**
   - Result: Frontend won't be able to connect to backend

3. **Using default SECRET_KEY in production**
   - Result: Application crash at startup

4. **Not setting ALLOWED_DEVELOPER_EMAILS**
   - Result: Application crash at startup

5. **Using SQLite without backup strategy**
   - Result: Data loss if server crashes

6. **Committing API keys to version control**
   - Result: Credentials exposed in git history

7. **Running with DEBUG=True**
   - Result: Stack traces and system info exposed to attackers

8. **CORS set to wildcard (`*`)**
   - Result: Any website can make requests to your API

---

## 🆘 Troubleshooting

### Application crashes with "SECRET_KEY must be set..."
- Verify you've exported `SECRET_KEY` with a 64+ character string
- Ensure it doesn't start with `dev-`

### Application crashes with "ALLOWED_DEVELOPER_EMAILS must be set..."
- Verify you've exported valid email addresses
- Format: `email1@domain.com,email2@domain.com`

### Frontend can't connect to backend
- Check `ALLOWED_ORIGIN` matches your frontend domain exactly
- Ensure it includes the protocol (`https://`)
- Check CORS headers in browser console

### Webhook verification fails
- Verify webhook secrets are correct and match provider settings
- Check webhook URL is correct: `https://yourdomain.com/api/billing/webhook`
- Ensure clock skew is minimal (within a few seconds)

---

For more information, see `.env.production.example` template file.
