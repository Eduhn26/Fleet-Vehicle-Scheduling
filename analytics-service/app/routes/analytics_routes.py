from fastapi import APIRouter

from app.core.settings import settings
from app.schemas.analytics_request import FleetAnalyticsDataset
from app.schemas.analytics_response import HealthResponse, AnalyticsOverviewResponse
from app.services.fleet_analytics_service import build_fleet_overview

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
def overview(dataset: FleetAnalyticsDataset) -> AnalyticsOverviewResponse:
    return build_fleet_overview(dataset)
