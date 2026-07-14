from datetime import datetime, timezone
from typing import Any

import pandas as pd

from app.core.settings import settings
from app.schemas.analytics_request import (
    AnalyticsFilters,
    AnalyticsExportRequest,
    AnalyticsOverviewRequest,
    DatasetCounts,
    FleetAnalyticsDataset,
)
from app.schemas.analytics_response import (
    AnalyticsExportResponse,
    AnalyticsOverviewResponse,
)

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


def _has_active_filters(filters: AnalyticsFilters) -> bool:
    return any(
        [
            filters.startDate,
            filters.endDate,
            filters.status,
            filters.vehicleId,
            filters.department,
        ]
    )


def _parse_date(value: str | None) -> pd.Timestamp | None:
    if not value:
        return None

    parsed = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(parsed):
        return None

    return parsed.normalize()


def _date_mask(
    dataframe: pd.DataFrame,
    column: str,
    start_date: str | None,
    end_date: str | None,
) -> pd.Series:
    mask = pd.Series(True, index=dataframe.index)

    if dataframe.empty or column not in dataframe.columns:
        return mask

    dates = pd.to_datetime(dataframe[column], errors="coerce", utc=True)
    start = _parse_date(start_date)
    end = _parse_date(end_date)

    if start is not None:
        mask &= dates >= start

    if end is not None:
        mask &= dates < end + pd.DateOffset(days=1)

    return mask.fillna(False)


def _filter_rentals(
    rentals_df: pd.DataFrame,
    filters: AnalyticsFilters,
) -> pd.DataFrame:
    if rentals_df.empty:
        return rentals_df.copy()

    filtered = rentals_df.copy()
    mask = _date_mask(filtered, "startDate", filters.startDate, filters.endDate)

    if filters.status and "status" in filtered.columns:
        mask &= filtered["status"].fillna("").astype(str) == filters.status

    if filters.vehicleId and "vehicleId" in filtered.columns:
        mask &= filtered["vehicleId"].fillna("").astype(str) == filters.vehicleId

    if filters.department and "user.department" in filtered.columns:
        mask &= (
            filtered["user.department"].fillna("Não informado").astype(str)
            == filters.department
        )

    return filtered.loc[mask].copy()


def _filter_mileage(
    mileage_df: pd.DataFrame,
    filtered_rentals_df: pd.DataFrame,
    filters: AnalyticsFilters,
) -> pd.DataFrame:
    if mileage_df.empty:
        return mileage_df.copy()

    filtered = mileage_df.copy()
    mask = _date_mask(filtered, "recordedAt", filters.startDate, filters.endDate)

    if filters.vehicleId and "vehicleId" in filtered.columns:
        mask &= filtered["vehicleId"].fillna("").astype(str) == filters.vehicleId

    rental_scope_filters = bool(filters.status or filters.department)
    if rental_scope_filters and "rentalId" in filtered.columns:
        rental_ids = set(
            filtered_rentals_df.get("id", pd.Series(dtype="object"))
            .dropna()
            .astype(str)
            .tolist()
        )
        mask &= filtered["rentalId"].fillna("").astype(str).isin(rental_ids)

    return filtered.loc[mask].copy()


def _filter_maintenance_vehicles(
    vehicles_df: pd.DataFrame,
    filters: AnalyticsFilters,
) -> pd.DataFrame:
    if vehicles_df.empty or not filters.vehicleId or "id" not in vehicles_df.columns:
        return vehicles_df.copy()

    return vehicles_df.loc[
        vehicles_df["id"].fillna("").astype(str) == filters.vehicleId
    ].copy()


def _count_unique(dataframe: pd.DataFrame, column: str) -> int:
    if dataframe.empty or column not in dataframe.columns:
        return 0

    return int(dataframe[column].dropna().astype(str).replace("", pd.NA).nunique())


def _build_filtered_counts(
    dataset: FleetAnalyticsDataset,
    rentals_df: pd.DataFrame,
    mileage_df: pd.DataFrame,
    filters: AnalyticsFilters,
) -> DatasetCounts:
    if not _has_active_filters(filters):
        return dataset.counts

    return DatasetCounts(
        rentals=int(len(rentals_df)),
        vehicles=_count_unique(rentals_df, "vehicleId"),
        users=_count_unique(rentals_df, "userId"),
        mileageHistory=int(len(mileage_df)),
    )


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
    if rentals_df.empty or "vehicleId" not in rentals_df.columns:
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


def _build_rental_trend(rentals_df: pd.DataFrame) -> list[dict[str, Any]]:
    if rentals_df.empty or "startDate" not in rentals_df.columns:
        return []

    working_df = rentals_df.copy()
    working_df["parsedStartDate"] = pd.to_datetime(
        working_df["startDate"],
        errors="coerce",
        utc=True,
    )
    working_df = working_df.dropna(subset=["parsedStartDate"])

    if working_df.empty:
        return []

    working_df["period"] = working_df["parsedStartDate"].dt.strftime("%Y-%m")
    working_df["label"] = working_df["parsedStartDate"].dt.strftime("%m/%Y")

    grouped = (
        working_df.groupby(["period", "label"], dropna=False)
        .size()
        .reset_index(name="total")
        .sort_values("period")
    )

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
    generated_at: str | None,
    counts: DatasetCounts,
    rental_metrics: dict[str, Any],
    vehicle_usage: list[dict[str, Any]],
    mileage_by_vehicle: list[dict[str, Any]],
    maintenance_alerts: list[dict[str, Any]],
) -> dict[str, Any]:
    top_vehicle = vehicle_usage[0] if vehicle_usage else None
    top_mileage_vehicle = mileage_by_vehicle[0] if mileage_by_vehicle else None

    return {
        "generatedAt": generated_at,
        "totalRentals": rental_metrics["totalRentals"],
        "totalVehicles": counts.vehicles,
        "totalUsers": counts.users,
        "totalMileageRecords": counts.mileageHistory,
        "averageDurationHours": rental_metrics["averageDurationHours"],
        "topVehicleByRentals": top_vehicle,
        "topVehicleByMileage": top_mileage_vehicle,
        "maintenanceAlertsCount": len(maintenance_alerts),
    }


def _build_insights(metrics: dict[str, Any], filters: AnalyticsFilters) -> list[str]:
    insights: list[str] = []

    summary = metrics.get("summary", {})
    top_vehicle = summary.get("topVehicleByRentals")
    top_mileage_vehicle = summary.get("topVehicleByMileage")
    maintenance_alerts_count = summary.get("maintenanceAlertsCount", 0)

    if _has_active_filters(filters):
        insights.append(
            f"Os filtros atuais retornaram {summary.get('totalRentals', 0)} reserva(s)."
        )

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
    payload: AnalyticsOverviewRequest,
) -> AnalyticsOverviewResponse:
    dataset = payload.dataset
    filters = payload.filters

    rentals_df = _to_records(dataset.rentals)
    vehicles_df = _to_records(dataset.vehicles)
    mileage_df = _to_records(dataset.mileageHistory)

    filtered_rentals_df = _filter_rentals(rentals_df, filters)
    filtered_mileage_df = _filter_mileage(mileage_df, filtered_rentals_df, filters)
    maintenance_vehicles_df = _filter_maintenance_vehicles(vehicles_df, filters)

    filtered_counts = _build_filtered_counts(
        dataset,
        filtered_rentals_df,
        filtered_mileage_df,
        filters,
    )

    rental_metrics = _build_rental_metrics(filtered_rentals_df)
    vehicle_usage = _build_vehicle_usage(filtered_rentals_df)
    department_usage = _build_department_usage(filtered_rentals_df)
    mileage_by_vehicle = _build_mileage_by_vehicle(filtered_mileage_df)
    rental_trend = _build_rental_trend(filtered_rentals_df)
    maintenance_alerts = _build_maintenance_alerts(maintenance_vehicles_df)

    metrics = {
        "summary": _build_summary(
            dataset.generatedAt,
            filtered_counts,
            rental_metrics,
            vehicle_usage,
            mileage_by_vehicle,
            maintenance_alerts,
        ),
        "rentals": rental_metrics,
        "rentalTrend": rental_trend,
        "vehicleUsage": vehicle_usage,
        "departmentUsage": department_usage,
        "mileageByVehicle": mileage_by_vehicle,
        "maintenanceAlerts": maintenance_alerts,
        "filterContext": {
            "active": _has_active_filters(filters),
            "sourceRentals": dataset.counts.rentals,
            "filteredRentals": filtered_counts.rentals,
        },
    }

    return AnalyticsOverviewResponse(
        status="OK",
        service=settings.service_name,
        phase="13.I",
        source="python-analytics-service",
        message="Python analytics service calculated filtered fleet metrics.",
        sourceCounts=dataset.counts,
        receivedCounts=filtered_counts,
        appliedFilters=filters,
        warnings=_build_warnings(dataset),
        insights=_build_insights(metrics, filters),
        metrics=metrics,
        nextStep="13.J - Add analytics service to Docker Compose",
    )



EXPORT_COLUMNS = {
    "summary": [
        "generatedAt",
        "totalRentals",
        "totalVehicles",
        "totalUsers",
        "totalMileageRecords",
        "averageDurationHours",
        "maintenanceAlertsCount",
        "topVehicleByRentals",
        "topVehicleRentals",
        "topVehicleByMileage",
        "topVehicleMileage",
    ],
    "rentals": [
        "rentalId",
        "startDate",
        "endDate",
        "status",
        "durationHours",
        "vehicleId",
        "vehicleLabel",
        "licensePlate",
        "department",
        "createdAt",
    ],
    "vehicles": [
        "vehicleId",
        "brand",
        "model",
        "vehicleLabel",
        "year",
        "licensePlate",
        "mileage",
        "status",
        "transmissionType",
        "fuelType",
        "passengers",
        "nextMaintenance",
        "lastMaintenanceMileage",
        "kmUntilMaintenance",
        "maintenanceProgressPercent",
        "isMaintenanceDue",
    ],
    "mileageHistory": [
        "historyId",
        "rentalId",
        "vehicleId",
        "vehicleLabel",
        "licensePlate",
        "previousMileage",
        "newMileage",
        "mileageDelta",
        "recordedAt",
    ],
    "rentalsByStatus": ["status", "total"],
    "vehicleUsage": [
        "vehicleId",
        "vehicleLabel",
        "licensePlate",
        "totalRentals",
        "totalDurationHours",
    ],
    "departmentUsage": ["department", "total"],
    "rentalTrend": ["period", "label", "total"],
    "maintenanceAlerts": [
        "vehicleId",
        "vehicleLabel",
        "licensePlate",
        "level",
        "message",
        "mileage",
        "kmUntilMaintenance",
        "maintenanceProgressPercent",
    ],
}


def _export_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def _to_export_rows(
    dataframe: pd.DataFrame,
    column_mapping: dict[str, str],
) -> list[dict[str, Any]]:
    if dataframe.empty:
        return []

    rows: list[dict[str, Any]] = []
    for record in dataframe.to_dict(orient="records"):
        row: dict[str, Any] = {}
        for output_column, source_column in column_mapping.items():
            value = record.get(source_column)
            if pd.isna(value):
                value = None
            row[output_column] = value
        rows.append(row)

    return rows


def _scope_export_vehicles(
    vehicles_df: pd.DataFrame,
    filtered_rentals_df: pd.DataFrame,
    filters: AnalyticsFilters,
) -> pd.DataFrame:
    if vehicles_df.empty:
        return vehicles_df.copy()

    if not _has_active_filters(filters):
        return vehicles_df.copy()

    vehicle_ids = set(
        filtered_rentals_df.get("vehicleId", pd.Series(dtype="object"))
        .dropna()
        .astype(str)
        .tolist()
    )

    if filters.vehicleId:
        vehicle_ids.add(filters.vehicleId)

    if not vehicle_ids or "id" not in vehicles_df.columns:
        return vehicles_df.iloc[0:0].copy()

    return vehicles_df.loc[
        vehicles_df["id"].fillna("").astype(str).isin(vehicle_ids)
    ].copy()


def _build_export_tables(
    dataset: FleetAnalyticsDataset,
    filters: AnalyticsFilters,
) -> dict[str, list[dict[str, Any]]]:
    rentals_df = _to_records(dataset.rentals)
    vehicles_df = _to_records(dataset.vehicles)
    mileage_df = _to_records(dataset.mileageHistory)

    filtered_rentals_df = _filter_rentals(rentals_df, filters)
    filtered_mileage_df = _filter_mileage(mileage_df, filtered_rentals_df, filters)
    scoped_vehicles_df = _scope_export_vehicles(
        vehicles_df,
        filtered_rentals_df,
        filters,
    )
    maintenance_vehicles_df = _filter_maintenance_vehicles(vehicles_df, filters)

    filtered_counts = _build_filtered_counts(
        dataset,
        filtered_rentals_df,
        filtered_mileage_df,
        filters,
    )
    rental_metrics = _build_rental_metrics(filtered_rentals_df)
    vehicle_usage = _build_vehicle_usage(filtered_rentals_df)
    department_usage = _build_department_usage(filtered_rentals_df)
    mileage_by_vehicle = _build_mileage_by_vehicle(filtered_mileage_df)
    rental_trend = _build_rental_trend(filtered_rentals_df)
    maintenance_alerts = _build_maintenance_alerts(maintenance_vehicles_df)
    summary = _build_summary(
        dataset.generatedAt,
        filtered_counts,
        rental_metrics,
        vehicle_usage,
        mileage_by_vehicle,
        maintenance_alerts,
    )

    top_rentals = summary.get("topVehicleByRentals") or {}
    top_mileage = summary.get("topVehicleByMileage") or {}

    summary_rows = [
        {
            "generatedAt": summary.get("generatedAt"),
            "totalRentals": summary.get("totalRentals", 0),
            "totalVehicles": summary.get("totalVehicles", 0),
            "totalUsers": summary.get("totalUsers", 0),
            "totalMileageRecords": summary.get("totalMileageRecords", 0),
            "averageDurationHours": summary.get("averageDurationHours", 0),
            "maintenanceAlertsCount": summary.get("maintenanceAlertsCount", 0),
            "topVehicleByRentals": top_rentals.get("vehicleLabel"),
            "topVehicleRentals": top_rentals.get("totalRentals", 0),
            "topVehicleByMileage": top_mileage.get("vehicleLabel"),
            "topVehicleMileage": top_mileage.get("totalMileageDelta", 0),
        }
    ]

    rental_rows = _to_export_rows(
        filtered_rentals_df,
        {
            "rentalId": "id",
            "startDate": "startDate",
            "endDate": "endDate",
            "status": "status",
            "durationHours": "durationHours",
            "vehicleId": "vehicleId",
            "vehicleLabel": "vehicle.label",
            "licensePlate": "vehicle.licensePlate",
            "department": "user.department",
            "createdAt": "createdAt",
        },
    )

    vehicle_rows = _to_export_rows(
        scoped_vehicles_df,
        {
            "vehicleId": "id",
            "brand": "brand",
            "model": "model",
            "vehicleLabel": "label",
            "year": "year",
            "licensePlate": "licensePlate",
            "mileage": "mileage",
            "status": "status",
            "transmissionType": "transmissionType",
            "fuelType": "fuelType",
            "passengers": "passengers",
            "nextMaintenance": "nextMaintenance",
            "lastMaintenanceMileage": "lastMaintenanceMileage",
            "kmUntilMaintenance": "kmUntilMaintenance",
            "maintenanceProgressPercent": "maintenanceProgressPercent",
            "isMaintenanceDue": "isMaintenanceDue",
        },
    )

    mileage_rows = _to_export_rows(
        filtered_mileage_df,
        {
            "historyId": "id",
            "rentalId": "rentalId",
            "vehicleId": "vehicleId",
            "vehicleLabel": "vehicle.label",
            "licensePlate": "vehicle.licensePlate",
            "previousMileage": "previousMileage",
            "newMileage": "newMileage",
            "mileageDelta": "mileageDelta",
            "recordedAt": "recordedAt",
        },
    )

    return {
        "summary": summary_rows,
        "rentals": rental_rows,
        "vehicles": vehicle_rows,
        "mileageHistory": mileage_rows,
        "rentalsByStatus": rental_metrics.get("rentalsByStatus", []),
        "vehicleUsage": vehicle_usage,
        "departmentUsage": department_usage,
        "rentalTrend": rental_trend,
        "maintenanceAlerts": maintenance_alerts,
    }


def build_power_bi_export(
    payload: AnalyticsExportRequest,
) -> AnalyticsExportResponse:
    tables = _build_export_tables(payload.dataset, payload.filters)
    timestamp = _export_timestamp()

    if payload.table:
        columns = EXPORT_COLUMNS[payload.table]
        rows = tables[payload.table]
        dataframe = pd.DataFrame(rows, columns=columns)
        csv_content = dataframe.to_csv(
            index=False,
            sep=";",
            decimal=",",
            lineterminator="\r\n",
        )

        return AnalyticsExportResponse(
            status="OK",
            service=settings.service_name,
            phase="13.I",
            source="python-analytics-service",
            generatedAt=payload.dataset.generatedAt,
            appliedFilters=payload.filters,
            table=payload.table,
            filename=f"fleet-analytics-{payload.table}-{timestamp}.csv",
            columns=columns,
            rows=rows,
            csv=csv_content,
            nextStep="13.J - Add analytics service to Docker Compose",
        )

    return AnalyticsExportResponse(
        status="OK",
        service=settings.service_name,
        phase="13.I",
        source="python-analytics-service",
        generatedAt=payload.dataset.generatedAt,
        appliedFilters=payload.filters,
        filename=f"fleet-analytics-power-bi-{timestamp}.json",
        tables=tables,
        nextStep="13.J - Add analytics service to Docker Compose",
    )
