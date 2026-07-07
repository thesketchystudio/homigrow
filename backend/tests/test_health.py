"""
tests/test_health.py

Smoke test confirming the TestClient fixture is wired up correctly and
the health endpoint responds as expected.
"""


def test_health_check(client):
    """The health endpoint returns 200 with the current environment."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "environment": "dev"}
