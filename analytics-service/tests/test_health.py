from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_live_health_returns_ok():
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "OK"
    assert response.json()["service"] == "fleet-analytics-service"
    assert response.json()["version"] == "0.2.0"


def test_ready_health_returns_ok():
    response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "OK"
    assert response.json()["service"] == "fleet-analytics-service"
