# Phase 13 — Fleet Intelligence

## Python Analytics · Mini ETL · Operational Metrics · Power BI Ready

---

## 1. Objective

Phase 13 introduces an analytical layer to the Fleet Vehicle Scheduling system.

The goal is to evolve the project from a vehicle scheduling application into a more complete fleet intelligence platform, capable of transforming operational data into metrics, rankings, maintenance alerts and executive insights.

This phase adds Python with a real architectural purpose: processing operational fleet data without mixing analytical calculations inside the main Node.js backend.

The intended result is:

```txt
Fleet Vehicle Scheduling
        ↓
Fleet Intelligence
```

In practical terms, this phase will create an analytics flow that can feed:

* an internal admin analytics dashboard in React;
* future Power BI reports;
* exported analytical datasets;
* operational decision-making for fleet administrators.

---

## 2. Current Project Context

Before this phase, the project already includes:

* Node.js / Express backend;
* React frontend;
* MongoDB Atlas with Mongoose;
* JWT authentication;
* role-based access control;
* admin and user dashboards;
* vehicle rental request workflow;
* approval and rejection lifecycle;
* return request workflow;
* mileage update flow;
* automatic maintenance status when mileage reaches the defined threshold;
* validation layer;
* services layer;
* centralized error handling;
* tests;
* CI pipeline;
* Docker Compose support;
* structured documentation by phases.

Because of this foundation, Phase 13 does not start from a CRUD application.

It starts from an operational system that already produces meaningful data.

---

## 3. Problem This Phase Solves

The system currently allows admins to operate the fleet, but it does not yet provide a strong analytical view of the operation.

The admin can see requests, vehicles and statuses, but cannot easily answer questions such as:

* Which vehicles are used the most?
* Which departments request more vehicles?
* What is the approval rate?
* What is the rejection rate?
* Which vehicles are close to maintenance?
* Which requests are stuck in pending or return workflows?
* How much mileage is being accumulated by each vehicle?
* Where are the operational bottlenecks?
* Which data should be exported for Power BI?

Phase 13 solves this by creating an analytics layer focused on decision-making.

---

## 4. Architectural Decision

The frontend must not call the Python service directly.

The Python service must not replace the Node.js backend.

The Node.js backend remains the secure entry point for the application.

The architecture for this phase is:

```txt
Frontend React
    ↓
Backend Node.js / Express
    ↓
Python Analytics Service / FastAPI
    ↓
Pandas Transformations
    ↓
Analytics Response
    ↓
React Dashboard / Power BI Export
```

The backend continues to handle:

* authentication;
* authorization;
* admin protection;
* data access;
* data normalization;
* API response contract.

The Python service handles:

* analytical calculations;
* aggregations;
* rankings;
* maintenance risk scoring;
* operational insights;
* transformation of normalized datasets.

---

## 5. Why Python

Python is introduced because this phase focuses on analytics.

The reason is not to add another language just for portfolio value.

Python is useful here because it provides a strong ecosystem for:

* data processing;
* ETL-style transformations;
* tabular analysis;
* metrics generation;
* future Power BI exports;
* future machine learning experiments.

The first version will use deterministic analytics, not machine learning.

Machine learning is intentionally kept out of the initial scope.

---

## 6. Mini ETL Concept

This phase introduces a small and realistic ETL pipeline.

It is not a corporate-scale data platform.

It is a project-level analytical pipeline.

```txt
Extract
   ↓
Transform
   ↓
Load
```

### Extract

The Node.js backend extracts operational data from:

* rental requests;
* vehicles;
* users;
* mileage history.

### Transform

The Python service transforms the normalized payload using Pandas.

Examples:

* total requests;
* requests by status;
* approval rate;
* rejection rate;
* completed rentals;
* pending returns;
* top used vehicles;
* requests by department;
* mileage by vehicle;
* maintenance risk indicators.

### Load

The first output format is JSON for the React dashboard.

Future outputs may include:

* CSV;
* JSON export;
* Excel export;
* Power BI-ready datasets.

---

## 7. Scope

### Included in Phase 13

* Create Phase 13 documentation.
* Create backend analytics route boundary.
* Protect analytics routes with admin access.
* Normalize fleet operational data in the Node.js backend.
* Create a separate Python FastAPI analytics service.
* Implement analytical calculations with Pandas.
* Integrate Node.js backend with the Python service.
* Create `/admin/analytics` page in React.
* Display KPI cards.
* Display vehicle usage rankings.
* Display department rankings.
* Display maintenance risk alerts.
* Display operational insights.
* Add safe fallback when analytics service is unavailable.
* Prepare export endpoints for future Power BI usage.
* Update Docker Compose with analytics service.
* Add tests for backend and Python analytics logic.
* Update README with the new architecture and storytelling.

### Not Included in the First Version

* Machine learning.
* Generative AI.
* Chatbot.
* Airflow.
* Spark.
* Data lake.
* Direct frontend-to-Python communication.
* Direct Python-to-MongoDB access.
* Rewriting the backend.
* Replacing MongoDB.
* Replacing React.
* Overengineering the system as a full microservices platform.

---

## 8. Main Metrics

The first analytics dashboard should focus on useful operational metrics.

### KPI Cards

* Total rental requests.
* Approval rate.
* Rejection rate.
* Completed rentals.
* Pending returns.
* Vehicles close to maintenance.

### Usage Metrics

* Most used vehicles.
* Mileage by vehicle.
* Average usage duration.
* Requests by period.
* Requests by status.

### Department Metrics

* Requests by department.
* Top requesting departments.
* Users with high request volume.

### Maintenance Metrics

* Current vehicle mileage.
* Mileage until next maintenance.
* Vehicles already in maintenance.
* Maintenance risk score.
* High-usage vehicles.

### Operational Insights

Examples:

```txt
The Volkswagen Polo has a high usage concentration and is close to maintenance.
```

```txt
The Operations department represents the highest number of vehicle requests.
```

```txt
Some return requests are pending admin confirmation.
```

---

## 9. Proposed Backend Files

```txt
backend/src/routes/analyticsRoutes.js
backend/src/controllers/analyticsController.js
backend/src/services/analyticsService.js
backend/src/services/analyticsClient.js
```

### Responsibility

`analyticsRoutes.js`

* Define analytics endpoints.
* Apply authentication.
* Apply admin authorization.

`analyticsController.js`

* Handle HTTP request and response.
* Stay thin.
* Delegate logic to service.

`analyticsService.js`

* Fetch operational data.
* Normalize dataset.
* Call analytics client.
* Apply fallback if Python service fails.

`analyticsClient.js`

* Call Python FastAPI service.
* Configure service URL.
* Configure timeout.
* Handle unavailable service errors.

---

## 10. Proposed Python Service Structure

```txt
analytics-service/
├── app/
│   ├── main.py
│   ├── routes/
│   │   └── analytics_routes.py
│   ├── services/
│   │   ├── fleet_analytics_service.py
│   │   └── maintenance_risk_service.py
│   ├── schemas/
│   │   ├── analytics_request.py
│   │   └── analytics_response.py
│   └── core/
│       └── settings.py
├── tests/
├── requirements.txt
├── Dockerfile
└── README.md
```

### Initial Python Endpoints

```txt
GET /health/live
GET /health/ready
POST /internal/analytics/overview
```

---

## 11. Proposed Frontend Files

```txt
frontend/src/pages/adminAnalytics.js
frontend/src/components/analytics/AnalyticsMetricCard.js
frontend/src/components/analytics/AnalyticsFilters.js
frontend/src/components/analytics/VehicleUsageRanking.js
frontend/src/components/analytics/DepartmentRanking.js
frontend/src/components/analytics/MaintenanceRiskPanel.js
frontend/src/components/analytics/OperationalInsights.js
frontend/src/styles/analytics.css
```

The page route should be:

```txt
/admin/analytics
```

The analytics dashboard should follow the existing visual identity of the project, but with a more executive and data-driven presentation.

---

## 12. Route Protection

Analytics routes must be admin-only.

The frontend must not expose analytics data to regular users.

The backend must protect all analytics endpoints using the existing authentication and role-based authorization strategy.

Expected route behavior:

```txt
Unauthenticated user → 401
Authenticated regular user → 403
Authenticated admin → 200
```

---

## 13. Fallback Strategy

The Node.js backend must not crash if the Python service is offline.

If Python analytics is unavailable, the backend should return a safe response such as:

```json
{
  "source": "fallback",
  "message": "Analytics service unavailable",
  "metrics": null,
  "insights": []
}
```

This keeps the main system stable.

Analytics is an intelligence layer, not the source of truth for operational workflows.

---

## 14. Power BI Strategy

Power BI will be introduced as an executive presentation layer.

It should not be required for the application to work.

The first Power BI-ready output may be:

```txt
GET /api/analytics/export/json
```

or:

```txt
GET /api/analytics/export/csv
```

Power BI should consume analytical datasets, not raw sensitive operational data.

---

## 15. Development Roadmap

### 13.0 — Initial Setup

Status: completed.

Actions:

* Create branch.
* Confirm Docker works.
* Confirm MongoDB Atlas connection.
* Confirm backend health check.
* Create initial empty commit.

Expected commit:

```bash
git commit --allow-empty -m "chore: start phase 13 fleet intelligence"
```

---

### 13.A — Phase Documentation

Goal:

Create this documentation file.

Expected file:

```txt
docs/phase-13.md
```

Expected commit:

```bash
git add docs/phase-13.md
git commit -m "docs: add phase 13 fleet intelligence plan"
```

---

### 13.B — Backend Analytics Boundary

Goal:

Create backend analytics route, controller, service and client boundaries without heavy analytics logic.

Expected commit:

```bash
git commit -m "feat: add analytics backend boundary"
```

---

### 13.C — Normalize Fleet Dataset

Goal:

Create a clean normalized dataset from operational models.

Expected commit:

```bash
git commit -m "feat: normalize fleet analytics dataset"
```

---

### 13.D — Python Analytics Service Foundation

Goal:

Create the FastAPI service structure with health endpoints.

Expected commit:

```bash
git commit -m "feat: add python analytics service foundation"
```

---

### 13.E — Pandas Metrics

Goal:

Implement the first metrics with Pandas.

Expected commit:

```bash
git commit -m "feat: calculate fleet analytics metrics with pandas"
```

---

### 13.F — Node to Python Integration

Goal:

Connect the Node.js backend to the Python analytics service.

Expected commit:

```bash
git commit -m "feat: integrate backend with python analytics service"
```

---

### 13.G — Admin Analytics Dashboard

Goal:

Create the `/admin/analytics` page.

Expected commit:

```bash
git commit -m "feat: add admin analytics dashboard"
```

---

### 13.H — Presentation Polish

Goal:

Improve the visual presentation for portfolio, LinkedIn and demo video.

Expected commit:

```bash
git commit -m "style: polish analytics dashboard presentation"
```

---

### 13.I — Power BI Export

Goal:

Create export endpoint for analytical datasets.

Expected commit:

```bash
git commit -m "feat: add analytics export for power bi"
```

---

### 13.J — Docker Compose Integration

Goal:

Add analytics-service to Docker Compose.

Expected commit:

```bash
git commit -m "chore: add analytics service to docker compose"
```

---

### 13.K — Tests

Goal:

Add coverage for backend analytics routes, dataset normalization and Python metrics.

Expected commit:

```bash
git commit -m "test: add analytics service coverage"
```

---

### 13.L — README and Storytelling

Goal:

Update README with architecture, usage, endpoints, screenshots and portfolio explanation.

Expected commit:

```bash
git commit -m "docs: update readme with fleet intelligence phase"
```

---

## 16. Success Criteria

Phase 13 is successful when:

* the project has a documented analytics architecture;
* backend analytics endpoints are admin-protected;
* operational data is normalized before analytics processing;
* Python FastAPI service calculates useful fleet metrics;
* React dashboard displays metrics clearly;
* Docker can run the full system;
* the analytics service can fail without breaking the main app;
* exports are prepared for Power BI;
* README explains why Python was introduced;
* the feature can be defended in technical interviews.

---

## 17. Portfolio Explanation

This phase can be explained as:

```txt
I evolved a fleet scheduling system into a fleet intelligence platform by adding a Python/FastAPI analytics service. The Node.js backend remains responsible for authentication, authorization and operational workflows, while Python processes normalized fleet data using Pandas to generate KPIs, rankings, maintenance alerts and Power BI-ready datasets.
```

A shorter version:

```txt
I added a Python analytics layer to a MERN fleet management project, using FastAPI and Pandas to transform operational data into decision-making metrics without mixing analytical processing into the main Node.js backend.
```

---

## 18. Engineering Principles

This phase follows the same principles as the rest of the project:

* incremental development;
* small commits;
* branch per feature;
* documentation per phase;
* clear separation of concerns;
* no business logic inside routes;
* no heavy logic inside controllers;
* backend remains the secure API boundary;
* Python has a clear analytical responsibility;
* frontend focuses on presentation;
* tests protect important rules;
* Docker keeps the environment reproducible.

---

## 19. Current Status

Phase 13 has been initialized.

The current branch is:

```txt
feat/phase-13-fleet-intelligence
```

Initial environment validation:

```txt
Backend health check: OK
MongoDB Atlas connection: OK
Frontend Docker startup: OK
Backend Docker startup: OK
```

Next step:

```txt
13.B — Backend Analytics Boundary
```
