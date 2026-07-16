from typing import Any

from pydantic import BaseModel, Field

from app.schemas.analytics_request import AnalyticsFilters, DatasetCounts


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class AnalyticsOverviewResponse(BaseModel):
    status: str
    service: str
    phase: str
    source: str
    message: str
    sourceCounts: DatasetCounts
    receivedCounts: DatasetCounts
    appliedFilters: AnalyticsFilters
    warnings: list[str] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    nextStep: str



class AnalyticsExportResponse(BaseModel):
    status: str
    service: str
    phase: str
    source: str
    generatedAt: str | None = None
    appliedFilters: AnalyticsFilters
    table: str | None = None
    filename: str
    columns: list[str] = Field(default_factory=list)
    rows: list[dict[str, Any]] = Field(default_factory=list)
    tables: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    csv: str | None = None
    nextStep: str
