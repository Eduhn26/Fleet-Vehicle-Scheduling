from fastapi import APIRouter

from app.core.settings import settings
from app.schemas.analytics_request import (
    AnalyticsExportRequest,
    AnalyticsOverviewRequest,
)
from app.schemas.analytics_response import (
    AnalyticsExportResponse,
    AnalyticsOverviewResponse,
    HealthResponse,
)
from app.services.fleet_analytics_service import (
    build_fleet_overview,
    build_power_bi_export,
)

router = APIRouter()


@router.get("/health/live", response_model=HealthResponse)
def live() -> HealthResponse:
    return HealthResponse(
        status="OK",
        service=settings.service_name,
        version=settings.version,
        environment=settings.environment,
    )


@router.get("/health/ready", response_model=HealthResponse)
def ready() -> HealthResponse:
    return HealthResponse(
        status="OK",
        service=settings.service_name,
        version=settings.version,
        environment=settings.environment,
    )


@router.post(
    "/internal/analytics/overview",
    response_model=AnalyticsOverviewResponse,
)
def overview(payload: AnalyticsOverviewRequest) -> AnalyticsOverviewResponse:
    return build_fleet_overview(payload)



@router.post(
    "/internal/analytics/export",
    response_model=AnalyticsExportResponse,
)
def export(payload: AnalyticsExportRequest) -> AnalyticsExportResponse:
    return build_power_bi_export(payload)
