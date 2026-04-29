# Auth Migration: Protected Endpoint Changes

This note documents endpoints that changed from public or default-user behavior to authenticated user behavior.

## What Changed

Before:
- Many routes used `user_id = 1` (default user) or had no auth guard.
- Admin cache clear endpoint was not role-protected.

After:
- User-scoped routes require bearer auth via `Depends(get_current_user)`.
- Admin route requires role check via `Depends(require_role(["admin"]))`.
- Route logic now scopes data to `current_user.id`.

## Endpoints Now Requiring Authentication

- `POST /api/chat`
- `POST /api/summarize`
- `GET /api/summaries`
- `POST /api/summarize/advanced`
- `POST /api/notes/highlight`
- `POST /api/notes/highlight/advanced`
- `POST /api/quiz/generate`
- `GET /api/quizzes`
- `POST /api/flashcards`
- `POST /api/flashcards/generate`
- `GET /api/flashcards`
- `GET /api/analytics`
- `POST /api/quiz/generate/advanced`
- `GET /api/analytics/dashboard`
- `GET /api/analytics/performance`
- `GET /api/analytics/trends`

## Endpoint With Admin Role Enforcement

- `POST /api/admin/clear-cache`

## Frontend Migration Notes

- All protected API requests must include:
  - `Authorization: Bearer <access_token>`
- If frontend calls these endpoints without a token, backend returns `401 Unauthorized`.
- If non-admin users call admin endpoint, backend returns `403 Forbidden`.

## Recommended Rollout Steps

1. Ensure login flow stores `access_token` and `refresh_token`.
2. Ensure API client attaches access token for protected endpoints.
3. Add token refresh or re-login handling on `401`.
4. Verify admin-only actions are only visible to admin users.
