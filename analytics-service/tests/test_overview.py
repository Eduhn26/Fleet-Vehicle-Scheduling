from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_overview_calculates_fleet_metrics_with_pandas():
    payload = {
        "generatedAt": "2026-06-22T22:10:00.000Z",
        "counts": {
            "rentals": 3,
            "vehicles": 2,
            "users": 2,
            "mileageHistory": 2,
        },
        "rentals": [
            {
                "id": "rental-1",
                "vehicleId": "vehicle-1",
                "status": "completed",
                "durationHours": 24,
                "user": {"department": "Operações"},
                "vehicle": {
                    "label": "Volkswagen Polo",
                    "licensePlate": "ABC-1234",
                },
            },
            {
                "id": "rental-2",
                "vehicleId": "vehicle-1",
                "status": "approved",
                "durationHours": 12,
                "user": {"department": "Operações"},
                "vehicle": {
                    "label": "Volkswagen Polo",
                    "licensePlate": "ABC-1234",
                },
            },
            {
                "id": "rental-3",
                "vehicleId": "vehicle-2",
                "status": "pending",
                "durationHours": 6,
                "user": {"department": "Administrativo"},
                "vehicle": {
                    "label": "Fiat Argo",
                    "licensePlate": "DEF-5678",
                },
            },
        ],
        "vehicles": [
            {
                "id": "vehicle-1",
                "label": "Volkswagen Polo",
                "licensePlate": "ABC-1234",
                "mileage": 49100,
                "kmUntilMaintenance": 900,
                "maintenanceProgressPercent": 98.2,
                "isMaintenanceDue": False,
            },
            {
                "id": "vehicle-2",
                "label": "Fiat Argo",
                "licensePlate": "DEF-5678",
                "mileage": 35000,
                "kmUntilMaintenance": 5000,
                "maintenanceProgressPercent": 70,
                "isMaintenanceDue": False,
            },
        ],
        "users": [
            {"id": "user-1", "department": "Operações"},
            {"id": "user-2", "department": "Administrativo"},
        ],
        "mileageHistory": [
            {
                "id": "history-1",
                "vehicleId": "vehicle-1",
                "mileageDelta": 120,
                "vehicle": {
                    "label": "Volkswagen Polo",
                    "licensePlate": "ABC-1234",
                },
            },
            {
                "id": "history-2",
                "vehicleId": "vehicle-2",
                "mileageDelta": 80,
                "vehicle": {
                    "label": "Fiat Argo",
                    "licensePlate": "DEF-5678",
                },
            },
        ],
    }

    response = client.post("/internal/analytics/overview", json=payload)

    assert response.status_code == 200

    body = response.json()
    metrics = body["metrics"]

    assert body["status"] == "OK"
    assert body["phase"] == "13.E"
    assert body["source"] == "python-analytics-service"
    assert body["receivedCounts"]["rentals"] == 3
    assert body["warnings"] == []

    assert metrics["summary"]["totalRentals"] == 3
    assert metrics["summary"]["totalVehicles"] == 2
    assert metrics["summary"]["maintenanceAlertsCount"] == 1
    assert metrics["rentals"]["averageDurationHours"] == 14

    assert metrics["rentals"]["rentalsByStatus"] == [
        {"status": "completed", "total": 1},
        {"status": "approved", "total": 1},
        {"status": "pending", "total": 1},
    ]

    assert metrics["vehicleUsage"][0]["vehicleLabel"] == "Volkswagen Polo"
    assert metrics["vehicleUsage"][0]["totalRentals"] == 2
    assert metrics["departmentUsage"][0] == {
        "department": "Operações",
        "total": 2,
    }
    assert metrics["mileageByVehicle"][0]["vehicleLabel"] == "Volkswagen Polo"
    assert metrics["mileageByVehicle"][0]["totalMileageDelta"] == 120
    assert metrics["maintenanceAlerts"][0]["level"] == "warning"


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
    assert body["phase"] == "13.E"
    assert body["warnings"] == ["rentals: expected 2, received 1"]
