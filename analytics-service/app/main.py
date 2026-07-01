from fastapi import FastAPI

from app.core.settings import settings
from app.routes.analytics_routes import router as analytics_router

app = FastAPI(
    title=settings.service_name,
    version=settings.version,
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "status": "OK",
        "service": settings.service_name,
        "version": settings.version,
    }


app.include_router(analytics_router)
