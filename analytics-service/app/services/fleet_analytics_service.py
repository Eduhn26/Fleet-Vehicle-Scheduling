from typing import Any

import pandas as pd

from app.core.settings import settings
from app.schemas.analytics_request import FleetAnalyticsDataset
from app.schemas.analytics_response import AnalyticsOverviewResponse

MAINTENANCE_WARNING_KM = 1000
MAINTENANCE_ATTENTION_PERCENT = 90


def _check_count(label: str, expected: int, actual: int) -> str | None:
    if expected == actual:
        return None

    return f"{label}: expected {expected}, received {actual}"


def _build_warnings(dataset: FleetAnalyticsDataset) -> list[str]:
    return [
        warning
        for warning in [
            _check_count("rentals", dataset.counts.rentals, len(dataset.rentals)),
            _check_count("vehicles", dataset.counts.vehicles, len(dataset.vehicles)),
            _check_count("users", dataset.counts.users, len(dataset.users)),
            _check_count(
                "mileageHistory",
                dataset.counts.mileageHistory,
                len(dataset.mileageHistory),
            ),
        ]
        if warning is not None
    ]


def _to_records(data: list[dict[str, Any]]) -> pd.DataFrame:
    if not data:
        return pd.DataFrame()

    return pd.json_normalize(data)


def _safe_number(value: Any, fallback: float = 0) -> float:
    number = pd.to_numeric(value, errors="coerce")

    if pd.isna(number):
        return fallback

    return float(number)


def _round(value: Any, decimals: int = 2) -> float:
    return round(_safe_number(value), decimals)


def _records_from_grouped_count(
    dataframe: pd.DataFrame,
    group_column: str,
    output_key: str,
) -> list[dict[str, Any]]:
    if dataframe.empty or group_column not in dataframe.columns:
        return []

    grouped = (
        dataframe[group_column]
        .fillna("Não informado")
        .replace("", "Não informado")
        .value_counts()
        .reset_index()
    )

    grouped.columns = [output_key, "total"]

    return grouped.to_dict(orient="records")


def _build_rental_metrics(rentals_df: pd.DataFrame) -> dict[str, Any]:
    rentals_by_status = _records_from_grouped_count(
        rentals_df,
        "status",
        "status",
    )

    if rentals_df.empty:
        return {
            "totalRentals": 0,
            "rentalsByStatus": rentals_by_status,
            "averageDurationHours": 0,
        }

    duration_series = pd.to_numeric(
        rentals_df.get("durationHours", pd.Series(dtype="float")),
        errors="coerce",
    ).fillna(0)

    return {
        "totalRentals": int(len(rentals_df)),
        "rentalsByStatus": rentals_by_status,
        "averageDurationHours": _round(duration_series.mean()),
    }


def _build_vehicle_usage(rentals_df: pd.DataFrame) -> list[dict[str, Any]]:
    required_columns = {"vehicleId"}

    if rentals_df.empty or not required_columns.issubset(rentals_df.columns):
        return []

    working_df = rentals_df.copy()
    working_df["vehicleLabel"] = working_df.get("vehicle.label", "Não informado")
    working_df["licensePlate"] = working_df.get("vehicle.licensePlate", "")
    working_df["durationHours"] = pd.to_numeric(
        working_df.get("durationHours", 0),
        errors="coerce",
    ).fillna(0)

    grouped = (
        working_df.groupby(["vehicleId", "vehicleLabel", "licensePlate"], dropna=False)
        .agg(
            totalRentals=("vehicleId", "count"),
            totalDurationHours=("durationHours", "sum"),
        )
        .reset_index()
        .sort_values(["totalRentals", "totalDurationHours"], ascending=False)
    )

    grouped["totalDurationHours"] = grouped["totalDurationHours"].round(2)

    return grouped.to_dict(orient="records")


def _build_department_usage(rentals_df: pd.DataFrame) -> list[dict[str, Any]]:
    return _records_from_grouped_count(
        rentals_df,
        "user.department",
        "department",
    )


def _build_mileage_by_vehicle(mileage_df: pd.DataFrame) -> list[dict[str, Any]]:
    if mileage_df.empty or "vehicleId" not in mileage_df.columns:
        return []

    working_df = mileage_df.copy()
    working_df["vehicleLabel"] = working_df.get("vehicle.label", "Não informado")
    working_df["licensePlate"] = working_df.get("vehicle.licensePlate", "")
    working_df["mileageDelta"] = pd.to_numeric(
        working_df.get("mileageDelta", 0),
        errors="coerce",
    ).fillna(0)

    grouped = (
        working_df.groupby(["vehicleId", "vehicleLabel", "licensePlate"], dropna=False)
        .agg(
            totalMileageDelta=("mileageDelta", "sum"),
            records=("vehicleId", "count"),
        )
        .reset_index()
        .sort_values("totalMileageDelta", ascending=False)
    )

    grouped["totalMileageDelta"] = grouped["totalMileageDelta"].round(2)

    return grouped.to_dict(orient="records")


def _build_maintenance_alerts(vehicles_df: pd.DataFrame) -> list[dict[str, Any]]:
    if vehicles_df.empty:
        return []

    alerts: list[dict[str, Any]] = []

    for vehicle in vehicles_df.to_dict(orient="records"):
        label = vehicle.get("label") or "Não informado"
        license_plate = vehicle.get("licensePlate") or ""
        km_until_maintenance = _safe_number(vehicle.get("kmUntilMaintenance"))
        maintenance_progress = _safe_number(vehicle.get("maintenanceProgressPercent"))
        is_due = bool(vehicle.get("isMaintenanceDue"))

        if is_due:
            level = "critical"
            message = f"{label} está com manutenção vencida."
        elif km_until_maintenance <= MAINTENANCE_WARNING_KM:
            level = "warning"
            message = f"{label} está a {int(km_until_maintenance)} km da próxima manutenção."
        elif maintenance_progress >= MAINTENANCE_ATTENTION_PERCENT:
            level = "attention"
            message = f"{label} já atingiu {maintenance_progress:.0f}% do ciclo de manutenção."
        else:
            continue

        alerts.append(
            {
                "vehicleId": vehicle.get("id"),
                "vehicleLabel": label,
                "licensePlate": license_plate,
                "level": level,
                "message": message,
                "mileage": _round(vehicle.get("mileage")),
                "kmUntilMaintenance": _round(km_until_maintenance),
                "maintenanceProgressPercent": _round(maintenance_progress),
            }
        )

    severity_order = {"critical": 0, "warning": 1, "attention": 2}

    return sorted(
        alerts,
        key=lambda alert: (
            severity_order.get(str(alert["level"]), 99),
            alert["kmUntilMaintenance"],
        ),
    )


def _build_summary(
    dataset: FleetAnalyticsDataset,
    rental_metrics: dict[str, Any],
    vehicle_usage: list[dict[str, Any]],
    mileage_by_vehicle: list[dict[str, Any]],
    maintenance_alerts: list[dict[str, Any]],
) -> dict[str, Any]:
    top_vehicle = vehicle_usage[0] if vehicle_usage else None
    top_mileage_vehicle = mileage_by_vehicle[0] if mileage_by_vehicle else None

    return {
        "generatedAt": dataset.generatedAt,
        "totalRentals": rental_metrics["totalRentals"],
        "totalVehicles": dataset.counts.vehicles,
        "totalUsers": dataset.counts.users,
        "totalMileageRecords": dataset.counts.mileageHistory,
        "averageDurationHours": rental_metrics["averageDurationHours"],
        "topVehicleByRentals": top_vehicle,
        "topVehicleByMileage": top_mileage_vehicle,
        "maintenanceAlertsCount": len(maintenance_alerts),
    }


def _build_insights(metrics: dict[str, Any]) -> list[str]:
    insights: list[str] = []

    summary = metrics.get("summary", {})
    top_vehicle = summary.get("topVehicleByRentals")
    top_mileage_vehicle = summary.get("topVehicleByMileage")
    maintenance_alerts_count = summary.get("maintenanceAlertsCount", 0)

    if top_vehicle:
        insights.append(
            f"Veículo mais solicitado: {top_vehicle['vehicleLabel']} "
            f"com {top_vehicle['totalRentals']} reservas."
        )

    if top_mileage_vehicle:
        insights.append(
            f"Maior quilometragem registrada: {top_mileage_vehicle['vehicleLabel']} "
            f"com {top_mileage_vehicle['totalMileageDelta']} km no histórico."
        )

    if maintenance_alerts_count:
        insights.append(
            f"Existem {maintenance_alerts_count} alerta(s) de manutenção para acompanhamento."
        )

    return insights


def build_fleet_overview(
    dataset: FleetAnalyticsDataset,
) -> AnalyticsOverviewResponse:
    rentals_df = _to_records(dataset.rentals)
    vehicles_df = _to_records(dataset.vehicles)
    mileage_df = _to_records(dataset.mileageHistory)

    rental_metrics = _build_rental_metrics(rentals_df)
    vehicle_usage = _build_vehicle_usage(rentals_df)
    department_usage = _build_department_usage(rentals_df)
    mileage_by_vehicle = _build_mileage_by_vehicle(mileage_df)
    maintenance_alerts = _build_maintenance_alerts(vehicles_df)

    metrics = {
        "summary": _build_summary(
            dataset,
            rental_metrics,
            vehicle_usage,
            mileage_by_vehicle,
            maintenance_alerts,
        ),
        "rentals": rental_metrics,
        "vehicleUsage": vehicle_usage,
        "departmentUsage": department_usage,
        "mileageByVehicle": mileage_by_vehicle,
        "maintenanceAlerts": maintenance_alerts,
    }

    return AnalyticsOverviewResponse(
        status="OK",
        service=settings.service_name,
        phase="13.E",
        source="python-analytics-service",
        message="Python analytics service calculated fleet metrics with pandas.",
        receivedCounts=dataset.counts,
        warnings=_build_warnings(dataset),
        insights=_build_insights(metrics),
        metrics=metrics,
        nextStep="13.F - Integrate Node backend with the Python analytics service",
    )
