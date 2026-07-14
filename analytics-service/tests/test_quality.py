import csv
import io

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.test_overview import build_dataset

client = TestClient(app)

SUPPORTED_EXPORT_TABLES = [
    "summary",
    "rentals",
    "vehicles",
    "mileageHistory",
    "rentalsByStatus",
    "vehicleUsage",
    "departmentUsage",
    "rentalTrend",
    "maintenanceAlerts",
]


def build_empty_dataset():
    return {
        "generatedAt": "2026-07-14T15:00:00.000Z",
        "counts": {
            "rentals": 0,
            "vehicles": 0,
            "users": 0,
            "mileageHistory": 0,
        },
        "rentals": [],
        "vehicles": [],
        "users": [],
        "mileageHistory": [],
    }


def test_empty_dataset_returns_a_stable_zero_state():
    response = client.post(
        "/internal/analytics/overview",
        json={"dataset": build_empty_dataset(), "filters": {}},
    )

    assert response.status_code == 200

    body = response.json()
    metrics = body["metrics"]

    assert body["receivedCounts"] == {
        "rentals": 0,
        "vehicles": 0,
        "users": 0,
        "mileageHistory": 0,
    }
    assert metrics["summary"]["totalRentals"] == 0
    assert metrics["summary"]["averageDurationHours"] == 0
    assert metrics["vehicleUsage"] == []
    assert metrics["departmentUsage"] == []
    assert metrics["rentalTrend"] == []
    assert metrics["maintenanceAlerts"] == []


def test_maintenance_alerts_are_sorted_by_severity():
    dataset = build_empty_dataset()
    dataset["counts"]["vehicles"] = 3
    dataset["vehicles"] = [
        {
            "id": "vehicle-attention",
            "label": "Toyota Corolla",
            "licensePlate": "ATT-0001",
            "mileage": 45000,
            "kmUntilMaintenance": 2000,
            "maintenanceProgressPercent": 95,
            "isMaintenanceDue": False,
        },
        {
            "id": "vehicle-warning",
            "label": "Fiat Argo",
            "licensePlate": "WAR-0002",
            "mileage": 49500,
            "kmUntilMaintenance": 500,
            "maintenanceProgressPercent": 85,
            "isMaintenanceDue": False,
        },
        {
            "id": "vehicle-critical",
            "label": "Volkswagen Polo",
            "licensePlate": "CRI-0003",
            "mileage": 51000,
            "kmUntilMaintenance": 0,
            "maintenanceProgressPercent": 100,
            "isMaintenanceDue": True,
        },
    ]

    response = client.post(
        "/internal/analytics/overview",
        json={"dataset": dataset, "filters": {}},
    )

    assert response.status_code == 200

    alerts = response.json()["metrics"]["maintenanceAlerts"]

    assert [alert["level"] for alert in alerts] == [
        "critical",
        "warning",
        "attention",
    ]
    assert alerts[0]["vehicleId"] == "vehicle-critical"
    assert alerts[1]["vehicleId"] == "vehicle-warning"
    assert alerts[2]["vehicleId"] == "vehicle-attention"


def test_final_date_filter_is_inclusive_for_the_entire_day():
    dataset = build_empty_dataset()
    dataset["counts"] = {
        "rentals": 2,
        "vehicles": 1,
        "users": 1,
        "mileageHistory": 0,
    }
    dataset["rentals"] = [
        {
            "id": "rental-last-minute",
            "userId": "user-1",
            "vehicleId": "vehicle-1",
            "status": "approved",
            "startDate": "2026-02-28T23:59:59.000Z",
            "durationHours": 2,
            "user": {"department": "Operações"},
            "vehicle": {
                "label": "Toyota Yaris",
                "licensePlate": "YAR-1234",
            },
        },
        {
            "id": "rental-next-day",
            "userId": "user-1",
            "vehicleId": "vehicle-1",
            "status": "approved",
            "startDate": "2026-03-01T00:00:00.000Z",
            "durationHours": 3,
            "user": {"department": "Operações"},
            "vehicle": {
                "label": "Toyota Yaris",
                "licensePlate": "YAR-1234",
            },
        },
    ]

    response = client.post(
        "/internal/analytics/overview",
        json={
            "dataset": dataset,
            "filters": {
                "endDate": "2026-02-28",
            },
        },
    )

    assert response.status_code == 200
    assert response.json()["receivedCounts"]["rentals"] == 1
    assert response.json()["metrics"]["summary"]["totalRentals"] == 1


@pytest.mark.parametrize("table_name", SUPPORTED_EXPORT_TABLES)
def test_all_supported_power_bi_tables_can_be_exported(table_name):
    response = client.post(
        "/internal/analytics/export",
        json={
            "dataset": build_dataset(),
            "filters": {},
            "table": table_name,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["table"] == table_name
    assert body["filename"].endswith(".csv")
    assert isinstance(body["columns"], list)
    assert isinstance(body["rows"], list)
    assert isinstance(body["csv"], str)


def test_csv_export_escapes_semicolons_quotes_accents_and_decimal_values():
    dataset = build_dataset()
    dataset["rentals"][0]["durationHours"] = 12.5
    dataset["rentals"][0]["user"]["department"] = "Pesquisa; Desenvolvimento"
    dataset["rentals"][0]["vehicle"]["label"] = 'Fiat "Argo"'

    response = client.post(
        "/internal/analytics/export",
        json={
            "dataset": dataset,
            "filters": {
                "status": "completed",
                "vehicleId": "vehicle-1",
            },
            "table": "rentals",
        },
    )

    assert response.status_code == 200

    csv_content = response.json()["csv"]
    rows = list(csv.DictReader(io.StringIO(csv_content), delimiter=";"))

    assert rows[0]["durationHours"] == "12,5"
    assert rows[0]["department"] == "Pesquisa; Desenvolvimento"
    assert rows[0]["vehicleLabel"] == 'Fiat "Argo"'


def test_overview_requires_the_normalized_dataset_contract():
    response = client.post(
        "/internal/analytics/overview",
        json={"filters": {}},
    )

    assert response.status_code == 422
