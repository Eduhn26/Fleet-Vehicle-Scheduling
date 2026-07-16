from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class DatasetCounts(BaseModel):
    rentals: int = 0
    vehicles: int = 0
    users: int = 0
    mileageHistory: int = 0


class FleetAnalyticsDataset(BaseModel):
    generatedAt: str | None = None
    counts: DatasetCounts = Field(default_factory=DatasetCounts)
    rentals: list[dict[str, Any]] = Field(default_factory=list)
    vehicles: list[dict[str, Any]] = Field(default_factory=list)
    users: list[dict[str, Any]] = Field(default_factory=list)
    mileageHistory: list[dict[str, Any]] = Field(default_factory=list)


class AnalyticsFilters(BaseModel):
    startDate: str | None = None
    endDate: str | None = None
    status: str | None = None
    vehicleId: str | None = None
    department: str | None = None

    @field_validator("startDate", "endDate", "status", "vehicleId", "department", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: Any) -> str | None:
        if value is None:
            return None

        normalized = str(value).strip()
        return normalized or None


class AnalyticsOverviewRequest(BaseModel):
    dataset: FleetAnalyticsDataset
    filters: AnalyticsFilters = Field(default_factory=AnalyticsFilters)



PowerBiExportTable = Literal[
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


class AnalyticsExportRequest(AnalyticsOverviewRequest):
    table: PowerBiExportTable | None = None
