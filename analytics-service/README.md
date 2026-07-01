# Fleet Analytics Service

Python/FastAPI analytics service for the Fleet Vehicle Scheduling project.

This service receives a normalized operational dataset from the Node.js backend and prepares the foundation for fleet analytics, metrics, rankings and future Power BI-ready exports.

## Responsibility

The service is responsible for analytical processing only.

It does not:

- authenticate users;
- authorize roles;
- read MongoDB directly;
- modify rentals;
- modify vehicles;
- replace the Node.js backend.

The Node.js backend remains the secure entry point of the product.

## Initial Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness check |
| POST | `/internal/analytics/overview` | Receives normalized fleet dataset |

## Local Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```

## Docker

```bash
docker build -t fleet-analytics-service:dev .
docker run --rm -p 8000:8000 fleet-analytics-service:dev
```

## Phase

Current phase:

```txt
13.D — Python Analytics Service Foundation
```

Next phase:

```txt
13.E — Calculate fleet analytics metrics with pandas
```
