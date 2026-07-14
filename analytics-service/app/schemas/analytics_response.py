from typing import Any

from pydantic import BaseModel, Field

from app.schemas.analytics_request import DatasetCounts


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
    receivedCounts: DatasetCounts
    warnings: list[str] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    nextStep: str
