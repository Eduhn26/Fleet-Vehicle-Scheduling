from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_overview_accepts_normalized_dataset():
    payload = {
        "generatedAt": "2026-06-22T22:10:00.000Z",
        "counts": {
            "rentals": 1,
            "vehicles": 1,
            "users": 1,
            "mileageHistory": 1,
        },
        "rentals": [{"id": "rental-1", "status": "completed"}],
        "vehicles": [{"id": "vehicle-1", "label": "Volkswagen Polo"}],
        "users": [{"id": "user-1", "department": "Operações"}],
        "mileageHistory": [{"id": "history-1", "mileageDelta": 120}],
    }

    response = client.post("/internal/analytics/overview", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "OK"
    assert body["phase"] == "13.D"
    assert body["source"] == "python-analytics-service"
    assert body["receivedCounts"]["rentals"] == 1
    assert body["receivedCounts"]["vehicles"] == 1
    assert body["receivedCounts"]["users"] == 1
    assert body["receivedCounts"]["mileageHistory"] == 1
    assert body["warnings"] == []


def test_overview_warns_when_counts_do_not_match_payload():
    payload = {
        "counts": {
            "rentals": 2,
            "vehicles": 0,
            "users": 0,
            "mileageHistory": 0,
        },
        "rentals": [{"id": "rental-1"}],
        "vehicles": [],
        "users": [],
        "mileageHistory": [],
    }

    response = client.post("/internal/analytics/overview", json=payload)

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "OK"
    assert body["warnings"] == ["rentals: expected 2, received 1"]
