from fastapi.testclient import TestClient

from app.main import app
from tests.test_overview import build_dataset

client = TestClient(app)


def test_json_export_returns_power_bi_ready_tables_without_sensitive_user_data():
    response = client.post(
        "/internal/analytics/export",
        json={"dataset": build_dataset(), "filters": {}},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "OK"
    assert body["phase"] == "13.I"
    assert body["table"] is None
    assert body["filename"].endswith(".json")
    assert set(body["tables"]) == {
        "summary",
        "rentals",
        "vehicles",
        "mileageHistory",
        "rentalsByStatus",
        "vehicleUsage",
        "departmentUsage",
        "rentalTrend",
        "maintenanceAlerts",
    }

    rental = body["tables"]["rentals"][0]
    assert rental["department"] == "Operações"
    assert "userId" not in rental
    assert "user" not in rental
    assert "adminNotes" not in rental


def test_csv_export_applies_filters_and_returns_selected_table():
    response = client.post(
        "/internal/analytics/export",
        json={
            "dataset": build_dataset(),
            "filters": {
                "startDate": "2026-02-01",
                "endDate": "2026-02-28",
                "status": "approved",
            },
            "table": "rentals",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["phase"] == "13.I"
    assert body["table"] == "rentals"
    assert body["filename"].endswith(".csv")
    assert len(body["rows"]) == 1
    assert body["rows"][0]["rentalId"] == "rental-2"
    assert body["rows"][0]["status"] == "approved"
    assert body["csv"].startswith("rentalId;startDate;endDate;status")
    assert "\r\n" in body["csv"]


def test_csv_export_rejects_unsupported_table():
    response = client.post(
        "/internal/analytics/export",
        json={
            "dataset": build_dataset(),
            "filters": {},
            "table": "users",
        },
    )

    assert response.status_code == 422

def test_csv_export_uses_excel_pt_br_decimal_format():
    response = client.post(
        "/internal/analytics/export",
        json={
            "dataset": build_dataset(),
            "filters": {},
            "table": "summary",
        },
    )

    assert response.status_code == 200

    csv_content = response.json()["csv"]

    assert csv_content.startswith("generatedAt;totalRentals;totalVehicles")
    assert ";12,5;" in csv_content
    assert "," in csv_content

