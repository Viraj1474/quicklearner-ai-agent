# Database Migrations and Environment Separation

This project now includes `alembic` in backend dependencies to support schema migrations safely across environments.

## Why this matters
- Prevents schema drift between local/dev/staging/prod.
- Makes auth, analytics, and future feature changes auditable.
- Enables zero-downtime style rollout planning.

## Quick setup
1. Install dependencies:
   - `pip install -r requirements.txt`
2. Initialize Alembic (one-time):
   - `alembic init alembic`
3. Configure DB URL in `alembic.ini` and environment script.
4. Create migration from model changes:
   - `alembic revision --autogenerate -m "describe change"`
5. Apply migration:
   - `alembic upgrade head`

## Environment files
- Development defaults: `backend/.env.example`
- Production template: `backend/.env.production.example`

## Recommended DB strategy
- Development: SQLite (`sqlite:///./ai_agent.db`)
- Production: PostgreSQL (`postgresql+psycopg2://...`)

## Best practices
- Keep one migration per logical change set.
- Never edit an applied migration in production.
- Run migration checks in CI before deploy.
