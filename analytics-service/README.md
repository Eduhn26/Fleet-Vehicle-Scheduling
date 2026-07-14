# Fleet Analytics Service

Python/FastAPI analytics service for the Fleet Vehicle Scheduling project.

The service receives a normalized operational dataset and analytical filters from the Node.js backend, then calculates fleet metrics with Pandas.

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

## Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness check |
| POST | `/internal/analytics/overview` | Receives dataset and filters, then returns fleet metrics |

## Filters supported in Phase 13.H

- initial date;
- final date;
- rental status;
- vehicle;
- department.

## Metrics

- rentals by status;
- average rental duration;
- rental volume by month;
- vehicle usage ranking;
- department usage ranking;
- mileage by vehicle;
- maintenance alerts;
- filtered operational summary;
- automatic insights.

## Request contract

```json
{
  "dataset": {
    "generatedAt": "2026-07-14T15:00:00.000Z",
    "counts": {},
    "rentals": [],
    "vehicles": [],
    "users": [],
    "mileageHistory": []
  },
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-06-30",
    "status": "approved",
    "vehicleId": null,
    "department": "Operações"
  }
}
```

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
docker build -t fleet-analytics-service:phase13h .
docker run --rm fleet-analytics-service:phase13h pytest
docker run --rm -p 8000:8000 --name fleet-analytics-service fleet-analytics-service:phase13h
```

## Phase

Current phase:

```txt
13.H — Filters and temporal analysis
```

Next phase:

```txt
13.I — Power BI-ready exports and analytical drill-downs
```
