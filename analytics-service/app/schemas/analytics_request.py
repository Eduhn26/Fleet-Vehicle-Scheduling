from typing import Any

from pydantic import BaseModel, Field


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
