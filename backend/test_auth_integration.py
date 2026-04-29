"""Integration tests for auth-protected endpoints and admin role enforcement."""

import unittest
import uuid

from fastapi.testclient import TestClient

from auth import create_access_token, hash_password
from database import SessionLocal, User, UserRole, OAuthProvider
from main import app


class AuthIntegrationTests(unittest.TestCase):
    """Covers protected endpoint access and admin-only route enforcement."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.created_user_ids = []

    @classmethod
    def tearDownClass(cls):
        db = SessionLocal()
        try:
            for user_id in cls.created_user_ids:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    db.delete(user)
            db.commit()
        finally:
            db.close()

    @classmethod
    def _create_user(cls, role: str) -> User:
        suffix = uuid.uuid4().hex[:10]
        db = SessionLocal()
        try:
            user = User(
                username=f"itest_{role}_{suffix}",
                email=f"itest_{role}_{suffix}@example.com",
                hashed_password=hash_password("StrongPass123!"),
                role=role,
                auth_provider=OAuthProvider.LOCAL.value,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            cls.created_user_ids.append(user.id)
            db.expunge(user)
            return user
        finally:
            db.close()

    @staticmethod
    def _auth_headers(user: User) -> dict:
        token = create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
            }
        )
        return {"Authorization": f"Bearer {token}"}

    def test_protected_endpoint_requires_auth(self):
        response = self.client.get("/api/summaries")
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_allows_authenticated_user(self):
        user = self._create_user(UserRole.USER.value)
        response = self.client.get("/api/summaries", headers=self._auth_headers(user))
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_admin_endpoint_requires_auth(self):
        response = self.client.post("/api/admin/clear-cache")
        self.assertEqual(response.status_code, 401)

    def test_admin_endpoint_forbids_non_admin(self):
        user = self._create_user(UserRole.USER.value)
        response = self.client.post("/api/admin/clear-cache", headers=self._auth_headers(user))
        self.assertEqual(response.status_code, 403)

    def test_admin_endpoint_allows_admin(self):
        admin_user = self._create_user(UserRole.ADMIN.value)
        response = self.client.post("/api/admin/clear-cache", headers=self._auth_headers(admin_user))
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

    def test_quizzes_endpoint_requires_auth(self):
        response = self.client.get("/api/quizzes")
        self.assertEqual(response.status_code, 401)

    def test_flashcards_endpoint_requires_auth(self):
        response = self.client.get("/api/flashcards")
        self.assertEqual(response.status_code, 401)

    def test_analytics_endpoint_requires_auth(self):
        response = self.client.get("/api/analytics")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_access_core_reads(self):
        user = self._create_user(UserRole.USER.value)
        headers = self._auth_headers(user)

        summaries = self.client.get("/api/summaries", headers=headers)
        quizzes = self.client.get("/api/quizzes", headers=headers)
        flashcards = self.client.get("/api/flashcards", headers=headers)
        analytics = self.client.get("/api/analytics", headers=headers)

        self.assertEqual(summaries.status_code, 200)
        self.assertEqual(quizzes.status_code, 200)
        self.assertEqual(flashcards.status_code, 200)
        self.assertEqual(analytics.status_code, 200)

    def test_summarize_endpoint_requires_auth(self):
        response = self.client.post("/api/summarize", json={"text": "This is sample text for summary."})
        self.assertEqual(response.status_code, 401)

    def test_billing_plans_endpoint_returns_monthly_and_yearly_options(self):
        response = self.client.get("/api/billing/plans")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("plans", payload)
        billing_cycles = {plan["billing_cycle"] for plan in payload["plans"]}
        self.assertIn("monthly", billing_cycles)
        self.assertIn("yearly", billing_cycles)

    def test_subscribe_endpoint_activates_premium_plan(self):
        user = self._create_user(UserRole.USER.value)
        headers = self._auth_headers(user)

        response = self.client.post(
            "/api/billing/subscribe",
            headers=headers,
            json={"billing_cycle": "monthly"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["is_premium"])
        self.assertEqual(payload["billing_cycle"], "monthly")
        self.assertEqual(payload["subscription_tier"], "premium")

        status_response = self.client.get("/api/billing/subscription", headers=headers)
        self.assertEqual(status_response.status_code, 200)
        status_payload = status_response.json()
        self.assertTrue(status_payload["is_premium"])
        self.assertEqual(status_payload["plan"]["billing_cycle"], "monthly")

    def test_free_user_has_daily_premium_quota(self):
        user = self._create_user(UserRole.USER.value)
        headers = self._auth_headers(user)

        usage = self.client.get("/api/billing/usage", headers=headers)
        self.assertEqual(usage.status_code, 200)
        usage_payload = usage.json()
        self.assertFalse(usage_payload["is_premium"])
        self.assertGreaterEqual(usage_payload["remaining_count"], 1)

    def test_free_user_premium_quota_exhausts_after_limit(self):
        user = self._create_user(UserRole.USER.value)
        headers = self._auth_headers(user)

        for _ in range(3):
            response = self.client.get("/api/analytics/dashboard", headers=headers)
            self.assertEqual(response.status_code, 200)

        exhausted = self.client.get("/api/analytics/dashboard", headers=headers)
        self.assertEqual(exhausted.status_code, 402)
        self.assertIn("Free plan limit reached", exhausted.json()["detail"])

    def test_refresh_rotates_refresh_token(self):
        user = self._create_user(UserRole.USER.value)
        login = self.client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "StrongPass123!", "remember_me": False},
        )
        self.assertEqual(login.status_code, 200)
        login_data = login.json()

        first_refresh = login_data["refresh_token"]
        refresh = self.client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
        self.assertEqual(refresh.status_code, 200)
        refreshed_data = refresh.json()

        self.assertIn("refresh_token", refreshed_data)
        self.assertNotEqual(first_refresh, refreshed_data["refresh_token"])

    def test_refresh_rejects_reused_revoked_token(self):
        user = self._create_user(UserRole.USER.value)
        login = self.client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "StrongPass123!", "remember_me": False},
        )
        self.assertEqual(login.status_code, 200)
        first_refresh = login.json()["refresh_token"]

        rotate = self.client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
        self.assertEqual(rotate.status_code, 200)

        reuse = self.client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
        self.assertEqual(reuse.status_code, 401)


if __name__ == "__main__":
    unittest.main()
