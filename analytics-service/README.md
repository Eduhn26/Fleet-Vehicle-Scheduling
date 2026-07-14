# Fleet Analytics Service

Python/FastAPI analytics service for the Fleet Vehicle Scheduling project.

The service receives a normalized operational dataset and analytical filters from the Node.js backend, then calculates fleet metrics and Power BI-ready exports with Pandas.

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
| POST | `/internal/analytics/export` | Produces analytical JSON or a selected CSV table |

## Filters

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

## Power BI export

The export endpoint receives the normalized dataset and the active dashboard filters.

Without `table`, it returns a JSON package with all analytical tables. With `table`, it returns the selected table and its CSV representation.

Supported tables:

- `summary`
- `rentals`
- `vehicles`
- `mileageHistory`
- `rentalsByStatus`
- `vehicleUsage`
- `departmentUsage`
- `rentalTrend`
- `maintenanceAlerts`

The export intentionally excludes passwords, emails, user names, notes and other unnecessary operational fields.

CSV files are formatted for Brazilian Excel defaults:

- semicolon (`;`) as the column delimiter;
- comma as the decimal separator;
- Windows-compatible CRLF line endings;
- UTF-8 BOM added by the Node.js download endpoint.

## Local Python setup

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

## Standalone Docker tests

The image can still be built independently for isolated tests:

```bash
docker build -t fleet-analytics-service:phase13j .
docker run --rm fleet-analytics-service:phase13j pytest
```

## Full system with Docker Compose

From the repository root:

```bash
docker compose up -d --build
docker compose ps
```

Docker Compose now starts the three application services:

```txt
fleet-analytics-service
fleet-backend
fleet-frontend
```

Internal communication uses the Compose network:

```txt
backend
  ↓ http://analytics-service:8000
analytics-service
```

The backend waits for the Python readiness healthcheck before starting. The frontend waits for the backend healthcheck.

To inspect logs:

```bash
docker compose logs --tail 100 analytics-service
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend
```

To test the analytics fallback without removing containers:

```bash
docker compose stop analytics-service
docker compose start analytics-service
```

To stop the full environment:

```bash
docker compose down
```

## Phase

Current phase:

```txt
13.J — Docker Compose integration
```

Next phase:

```txt
13.K — Analytics test coverage and quality hardening
```
