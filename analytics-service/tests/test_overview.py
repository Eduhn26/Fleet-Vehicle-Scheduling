from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def build_dataset():
    return {
        "generatedAt": "2026-07-14T15:00:00.000Z",
        "counts": {
            "rentals": 4,
            "vehicles": 3,
            "users": 3,
            "mileageHistory": 3,
        },
        "rentals": [
            {
                "id": "rental-1",
                "userId": "user-1",
                "vehicleId": "vehicle-1",
                "status": "completed",
                "startDate": "2026-01-10T10:00:00.000Z",
                "durationHours": 24,
                "user": {"department": "Operações"},
                "vehicle": {
                    "label": "Volkswagen Polo",
                    "licensePlate": "ABC-1234",
                },
            },
            {
                "id": "rental-2",
                "userId": "user-1",
                "vehicleId": "vehicle-1",
                "status": "approved",
                "startDate": "2026-02-12T10:00:00.000Z",
                "durationHours": 12,
                "user": {"department": "Operações"},
                "vehicle": {
                    "label": "Volkswagen Polo",
                    "licensePlate": "ABC-1234",
                },
            },
            {
                "id": "rental-3",
                "userId": "user-2",
                "vehicleId": "vehicle-2",
                "status": "pending",
                "startDate": "2026-02-20T10:00:00.000Z",
                "durationHours": 6,
                "user": {"department": "Administrativo"},
                "vehicle": {
                    "label": "Fiat Argo",
                    "licensePlate": "DEF-5678",
                },
            },
            {
                "id": "rental-4",
                "userId": "user-3",
                "vehicleId": "vehicle-3",
                "status": "completed",
                "startDate": "2026-03-05T10:00:00.000Z",
                "durationHours": 8,
                "user": {"department": "Financeiro"},
                "vehicle": {
                    "label": "Toyota Yaris",
                    "licensePlate": "GHI-9012",
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
            {
                "id": "vehicle-3",
                "label": "Toyota Yaris",
                "licensePlate": "GHI-9012",
                "mileage": 28000,
                "kmUntilMaintenance": 4000,
                "maintenanceProgressPercent": 72,
                "isMaintenanceDue": False,
            },
        ],
        "users": [
            {"id": "user-1", "department": "Operações"},
            {"id": "user-2", "department": "Administrativo"},
            {"id": "user-3", "department": "Financeiro"},
        ],
        "mileageHistory": [
            {
                "id": "history-1",
                "rentalId": "rental-1",
                "vehicleId": "vehicle-1",
                "recordedAt": "2026-01-10T18:00:00.000Z",
                "mileageDelta": 120,
                "vehicle": {
                    "label": "Volkswagen Polo",
                    "licensePlate": "ABC-1234",
                },
            },
            {
                "id": "history-2",
                "rentalId": "rental-3",
                "vehicleId": "vehicle-2",
                "recordedAt": "2026-02-20T18:00:00.000Z",
                "mileageDelta": 80,
                "vehicle": {
                    "label": "Fiat Argo",
                    "licensePlate": "DEF-5678",
                },
            },
            {
                "id": "history-3",
                "rentalId": "rental-4",
                "vehicleId": "vehicle-3",
                "recordedAt": "2026-03-05T18:00:00.000Z",
                "mileageDelta": 60,
                "vehicle": {
                    "label": "Toyota Yaris",
                    "licensePlate": "GHI-9012",
                },
            },
        ],
    }


def test_overview_calculates_fleet_metrics_and_temporal_trend():
    response = client.post(
        "/internal/analytics/overview",
        json={"dataset": build_dataset(), "filters": {}},
    )

    assert response.status_code == 200

    body = response.json()
    metrics = body["metrics"]

    assert body["status"] == "OK"
    assert body["phase"] == "13.H"
    assert body["source"] == "python-analytics-service"
    assert body["receivedCounts"]["rentals"] == 4
    assert body["sourceCounts"]["rentals"] == 4
    assert body["appliedFilters"] == {
        "startDate": None,
        "endDate": None,
        "status": None,
        "vehicleId": None,
        "department": None,
    }

    assert metrics["summary"]["totalRentals"] == 4
    assert metrics["summary"]["totalVehicles"] == 3
    assert metrics["summary"]["maintenanceAlertsCount"] == 1
    assert metrics["rentals"]["averageDurationHours"] == 12.5
    assert metrics["rentalTrend"] == [
        {"period": "2026-01", "label": "01/2026", "total": 1},
        {"period": "2026-02", "label": "02/2026", "total": 2},
        {"period": "2026-03", "label": "03/2026", "total": 1},
    ]


def test_overview_applies_period_status_vehicle_and_department_filters():
    response = client.post(
        "/internal/analytics/overview",
        json={
            "dataset": build_dataset(),
            "filters": {
                "startDate": "2026-02-01",
                "endDate": "2026-02-28",
                "status": "approved",
                "vehicleId": "vehicle-1",
                "department": "Operações",
            },
        },
    )

    assert response.status_code == 200

    body = response.json()
    metrics = body["metrics"]

    assert body["receivedCounts"] == {
        "rentals": 1,
        "vehicles": 1,
        "users": 1,
        "mileageHistory": 0,
    }
    assert body["appliedFilters"]["status"] == "approved"
    assert metrics["summary"]["totalRentals"] == 1
    assert metrics["rentals"]["averageDurationHours"] == 12
    assert metrics["vehicleUsage"][0]["vehicleLabel"] == "Volkswagen Polo"
    assert metrics["departmentUsage"] == [
        {"department": "Operações", "total": 1}
    ]
    assert metrics["rentalTrend"] == [
        {"period": "2026-02", "label": "02/2026", "total": 1}
    ]
    assert metrics["filterContext"] == {
        "active": True,
        "sourceRentals": 4,
        "filteredRentals": 1,
    }


def test_overview_filters_mileage_by_period_and_vehicle():
    response = client.post(
        "/internal/analytics/overview",
        json={
            "dataset": build_dataset(),
            "filters": {
                "startDate": "2026-03-01",
                "endDate": "2026-03-31",
                "vehicleId": "vehicle-3",
            },
        },
    )

    assert response.status_code == 200

    body = response.json()
    metrics = body["metrics"]

    assert body["receivedCounts"]["mileageHistory"] == 1
    assert metrics["mileageByVehicle"] == [
        {
            "vehicleId": "vehicle-3",
            "vehicleLabel": "Toyota Yaris",
            "licensePlate": "GHI-9012",
            "totalMileageDelta": 60,
            "records": 1,
        }
    ]


def test_overview_warns_when_counts_do_not_match_payload():
    dataset = build_dataset()
    dataset["counts"]["rentals"] = 5

    response = client.post(
        "/internal/analytics/overview",
        json={"dataset": dataset, "filters": {}},
    )

    assert response.status_code == 200
    assert response.json()["warnings"] == ["rentals: expected 5, received 4"]
