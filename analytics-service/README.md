# Fleet Analytics Service

Python/FastAPI analytics service for the Fleet Vehicle Scheduling project.

The service receives a normalized operational dataset from the Node.js backend and calculates fleet metrics with Pandas.

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
| POST | `/internal/analytics/overview` | Receives normalized fleet dataset and returns fleet metrics |

## Metrics calculated in Phase 13.E

- rentals by status;
- average rental duration;
- vehicle usage ranking;
- department usage ranking;
- mileage by vehicle;
- maintenance alerts;
- operational summary;
- initial insights for dashboard usage.

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
docker build -t fleet-analytics-service:phase13e .
docker run --rm fleet-analytics-service:phase13e pytest
docker run --rm -p 8000:8000 --name fleet-analytics-service fleet-analytics-service:phase13e
```

## Phase

Current phase:

```txt
13.E — Fleet Metrics with Pandas
```

Next phase:

```txt
13.F — Integrate Node backend with the Python analytics service
```
