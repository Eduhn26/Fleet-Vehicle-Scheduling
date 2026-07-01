from app.core.settings import settings
from app.schemas.analytics_request import FleetAnalyticsDataset
from app.schemas.analytics_response import AnalyticsOverviewResponse


def _check_count(label: str, expected: int, actual: int) -> str | None:
    if expected == actual:
        return None

    return f"{label}: expected {expected}, received {actual}"


def build_initial_overview(
    dataset: FleetAnalyticsDataset,
) -> AnalyticsOverviewResponse:
    warnings = [
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

    return AnalyticsOverviewResponse(
        status="OK",
        service=settings.service_name,
        phase="13.D",
        source="python-analytics-service",
        message="Python analytics service received the normalized fleet dataset.",
        receivedCounts=dataset.counts,
        warnings=warnings,
        insights=[],
        nextStep="13.E - Calculate fleet analytics metrics with pandas",
    )
