"""
Test script for Supabase JWT authentication and data isolation.

Note: Since we are using an actual Supabase project in the cloud for auth,
these tests cannot easily mock the token generation. 
This script verifies the behavior of the FastAPI dependency (401 on missing/invalid token)
and tests the API structure. Full integration testing would require signing in a real
test user via Supabase and retrieving a token.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_auth_missing_header():
    """Verify that a request with no Authorization header is rejected."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing authorization header"

def test_auth_invalid_token(monkeypatch):
    """Verify that a request with an invalid token is rejected."""
    from app.auth import dependencies
    monkeypatch.setattr(dependencies, "SUPABASE_JWT_SECRET", "dummy_secret_for_tests")
    headers = {"Authorization": "Bearer not.a.real.token"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"] or "Not enough segments" in response.text

def test_unauthenticated_scenarios_access():
    """Verify that scenarios cannot be accessed without a token."""
    response = client.get("/api/scenarios/")
    assert response.status_code == 401

    response = client.post("/api/scenarios/", json={"type": "rent_vs_buy"})
    assert response.status_code == 401

def test_health_check_public():
    """Verify the health check endpoint remains public."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
