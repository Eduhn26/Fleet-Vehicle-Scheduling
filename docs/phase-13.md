# 🚀 Phase 13 — Fleet Intelligence & Operational Analytics

## 🎯 Phase Objective

Phase 13 evolves Fleet Vehicle Scheduling from an operational fleet management system into a platform with a dedicated intelligence layer.

The phase introduces:

- a protected analytics boundary in Node.js;
- a normalized operational dataset;
- a separate Python analytics service with FastAPI;
- analytical processing with Pandas;
- a Fleet Intelligence experience in React;
- automatic filters and contextual KPIs;
- temporal analysis and operational rankings;
- maintenance intelligence;
- JSON and CSV exports prepared for external BI tools;
- safe fallback when the Python service is unavailable;
- Docker Compose integration for the analytics service;
- dedicated tests and coverage;
- a deterministic annual demonstration dataset.

This phase establishes a clear separation between **operational workflows** and **analytical processing**.

---

## 🧠 Why Fleet Intelligence

Before this phase, administrators could operate the fleet but had limited support for answering broader operational questions.

Examples:

- Which vehicles are requested the most?
- Which departments generate the highest demand?
- How does request volume change over time?
- How much mileage is each vehicle accumulating?
- Which vehicles are approaching maintenance?
- What is currently happening in the fleet?
- Which analytical datasets should be exported for external reporting?

The goal was not to replace the existing application with a BI tool.

Instead, the project gained an operational intelligence layer inside the product, while deeper historical analysis remains a responsibility for a future Power BI phase.

---

## 🧱 Core Components Implemented

### Node.js Analytics Boundary

The Node.js backend remains the secure API boundary of the system.

Main files:

```txt
backend/src/controllers/analyticsController.js
backend/src/routes/analyticsRoutes.js
backend/src/services/analyticsClient.js
backend/src/services/analyticsService.js
```

Responsibilities:

- authenticate requests;
- authorize admin-only access;
- access MongoDB through existing models;
- normalize the analytical dataset;
- communicate with the Python service;
- enforce timeout behavior;
- translate integration failures;
- provide safe fallback responses;
- expose JSON and CSV exports.

Public analytics routes:

```txt
GET /api/analytics/health
GET /api/analytics/overview
GET /api/analytics/export/json
GET /api/analytics/export/csv
```

Expected protection:

```txt
Unauthenticated user       → 401
Authenticated regular user → 403
Authenticated admin        → 200
```

Real risks prevented:

- exposing analytics data directly to unauthorized users;
- coupling the frontend to the Python service;
- allowing a secondary dependency to become the main application boundary.

---

### Normalized Analytics Dataset

The backend builds a normalized payload using operational data from:

```txt
RentalRequest
Vehicle
User
VehicleMileageHistory
```

The Python service does not receive raw Mongoose documents and does not connect directly to MongoDB.

This boundary provides:

- a stable integration contract;
- explicit data ownership;
- reduced coupling between analytics and persistence;
- controlled exposure of only the fields required for analysis.

Sensitive authentication fields are excluded from the analytical flow.

---

### Python Analytics Service

A separate service was introduced under:

```txt
analytics-service/
```

Technology stack:

```txt
Python
FastAPI
Pandas
Pydantic
Pytest
pytest-cov
```

Main structure:

```txt
analytics-service/
├── app/
│   ├── core/
│   ├── routes/
│   ├── schemas/
│   └── services/
├── tests/
├── Dockerfile
├── pytest.ini
└── requirements.txt
```

Internal endpoints:

```txt
GET /health/live
GET /health/ready
POST /internal/analytics/overview
POST /internal/analytics/export
```

The service is consumed by Node.js, never directly by the browser.

---

### Pandas Processing Layer

Pandas is responsible for the analytical transformations.

The service calculates:

- total rentals;
- users represented;
- vehicles represented in the current scope;
- average reservation duration;
- rentals by status;
- rental evolution by month;
- vehicle usage ranking;
- accumulated duration by vehicle;
- demand by department;
- mileage by vehicle;
- maintenance alerts;
- analytical export tables.

The analytical logic remains deterministic.

Machine learning, generative AI, Airflow, Spark and data lakes were intentionally kept outside this phase.

---

### Node → Python Integration

The integration flow is:

```txt
React
  ↓
Node.js / Express
  ↓
Normalized Dataset
  ↓
FastAPI
  ↓
Pandas
  ↓
Analytics Response
```

Architectural guarantees:

- React does not call Python directly.
- Python does not access MongoDB.
- Node.js remains responsible for authentication and authorization.
- MongoDB remains the operational source of truth.
- Python is an analytical dependency, not the main application backend.

---

### Fleet Intelligence Dashboard

The administrative interface gained:

```txt
/admin/analytics
```

The page evolved from a simple analytics output into an operational intelligence experience.

The final structure prioritizes:

```txt
Context
↓
Filters
↓
KPIs
↓
Immediate visual response
↓
Operational interpretation
↓
Maintenance
↓
Rankings
↓
Data export
```

The frontend uses React and native SVG for visualizations without introducing a new charting library.

---

### Operational Analytics UX Evolution

The final Fleet Intelligence experience includes:

- a dedicated visual identity;
- internal sidebar navigation;
- scroll-aware active section highlighting;
- improved information hierarchy;
- better use of page width;
- reduced visual repetition;
- contextual copy written for product users instead of developers;
- compact first-fold presentation for easier operational reading and project demos.

The React page is intentionally positioned as **operational analytics**.

Its main question is:

> What is happening with the fleet now?

A future Power BI layer will focus on deeper historical exploration and comparative analysis.

---

### Automatic Filters

Supported filters:

```txt
Start date
End date
Status
Vehicle
Department
```

The final interaction is:

```txt
Select filter
↓
Automatic update
↓
New metrics and visualizations
```

The page uses:

- a short debounce;
- background refresh;
- preservation of the previous data while a new request is loading;
- visual indication that the analysis is updating;
- active filter chips;
- clear filter reset.

The final date is treated as inclusive throughout the selected day.

---

### Contextual KPIs

The KPI layer adapts to the active analytical scope.

Examples:

```txt
Reservations
1,620
```

With an active filter:

```txt
Reservations in scope
10

10 of 1,620 in history
```

When a specific vehicle is selected, the interface avoids presenting redundant information such as a generic vehicle count of `1` when another contextual indicator is more useful.

---

### Adaptive Temporal Analysis

The reservation evolution visualization adapts to the number of available periods.

#### Three or more periods

A complete temporal chart is displayed.

#### Two periods

The interface presents a direct comparison and percentage change.

#### One period

The page presents a period summary instead of forcing an almost empty chart.

This prevents visually weak charts and improves the interpretation of small analytical scopes.

---

### Contextual Insights

Insights are generated according to the active filter context.

Without a specific filter, the page can highlight:

- the most requested vehicle;
- the department with the highest demand;
- current maintenance attention.

With a vehicle filter, the page prioritizes:

- reservations for that vehicle;
- average reservation duration;
- maintenance context.

With department or status filters, the insights adapt to the selected scope.

This avoids redundant outputs such as:

```txt
Selected vehicle: Honda HRV
Insight: Most requested vehicle: Honda HRV
```

---

### Status Semantics

The backend status values were preserved.

Technical values remain:

```txt
pending
approved
return_pending
completed
rejected
cancelled
```

The interface introduced a clearer operational interpretation.

#### In progress

```txt
Pending
Active
Return pending
```

#### Closed

```txt
Completed
Rejected
Cancelled
```

The backend value:

```txt
approved
```

is presented to users as:

```txt
Active
```

This makes it clear that an approved reservation represents a current operational stage, while a completed reservation represents the end of the lifecycle.

Conceptual flow:

```txt
PENDING
   │
   ├── REJECTED
   │
   └── ACTIVE / APPROVED
            │
            ├── CANCELLED
            │
            └── RETURN PENDING
                       │
                       └── COMPLETED
```

---

### Maintenance Intelligence

Maintenance alerts remain an operational view of the current fleet.

Historical filters such as period, department or rental status do not hide current maintenance alerts.

When a specific vehicle is selected, the maintenance view can be restricted to that vehicle.

This behavior is intentional because maintenance represents the fleet's current operational state rather than a historical rental result.

---

### Empty States

When an analytical scope returns no rentals, the interface displays a single clear empty state instead of repeating several independent "no data" messages.

Example:

```txt
No reservations were found with the current filters.

Adjust the period or remove one of the filters to expand the analysis.
```

Current maintenance alerts can remain visible even when the rental scope is empty.

---

### Power BI-ready Exports

The backend exposes:

```txt
GET /api/analytics/export/json
GET /api/analytics/export/csv?table=<table>
```

Supported tables:

```txt
summary
rentals
vehicles
mileageHistory
rentalsByStatus
vehicleUsage
departmentUsage
rentalTrend
maintenanceAlerts
```

CSV formatting was adjusted for Excel in Portuguese-Brazil environments:

```txt
Delimiter: ;
Decimal separator: ,
Encoding: UTF-8 with BOM
Line ending: CRLF
```

The Phase 13 scope prepares the analytical datasets.

The Power BI report itself is intentionally left for a separate project phase.

---

### Analytics Fallback

The Node.js backend does not fail when the Python service is unavailable.

Validated degraded flow:

```txt
Python unavailable
        ↓
Node.js remains available
        ↓
Operational workflows continue
        ↓
Basic counts remain visible
        ↓
Advanced analytics are hidden
```

The page clearly communicates degraded mode instead of rendering incomplete analytics as if they were complete.

---

### Docker Compose Integration

The local environment now includes:

```txt
fleet-frontend
fleet-backend
fleet-analytics-service
```

Internal service communication:

```txt
Backend
   ↓
http://analytics-service:8000
```

The analytics service includes health checks, and the backend is configured to wait for service readiness in the containerized environment.

---

## 📊 Annual Demonstration Dataset

A deterministic annual presentation seed was introduced:

```txt
backend/scripts/seedAnnualPresentation.js
```

Commands:

```bash
cd backend
npm run seed:annual:dry-run
npm run seed:annual
```

The dataset simulates the 2025 closing period of a company with approximately 1,000 employees.

Final scenario:

```txt
Company employees: 1,000
System users: 226
Original fleet vehicles: 5
Rental requests: 1,620
Completed rentals: 1,330
Mileage history records: 1,330
Registered mileage: 111,120 km
Average reservation duration: 3.72 h
Maintenance alerts: 3
```

Original fleet preserved:

```txt
Jeep Compass
Volkswagen Polo Highline
Toyota Yaris
Toyota Etios
Honda HRV
```

Rental status distribution:

```txt
Completed: 1,330
Rejected: 140
Cancelled: 100
Pending: 20
Active: 20
Return pending: 10
```

Monthly distribution:

```txt
01/2025: 100
02/2025: 110
03/2025: 140
04/2025: 145
05/2025: 155
06/2025: 135
07/2025: 110
08/2025: 150
09/2025: 165
10/2025: 170
11/2025: 145
12/2025: 95
```

The seed is deterministic and produces the same scenario across dry runs.

> The dataset is demonstrative and simulated for technical presentation. It does not represent operational data from a real company.

---

## 🛡️ Architectural Guarantees

The phase preserves the boundaries established in previous phases.

```txt
React
  ↓
Node.js / Express
  ├── Authentication
  ├── Authorization
  ├── MongoDB
  ├── Operational workflows
  └── Analytics boundary
          ↓
      FastAPI
          ↓
       Pandas
```

Key guarantees:

- Node.js remains the public backend.
- Python is not a second public backend.
- MongoDB remains the source of truth.
- Analytics cannot break the main fleet workflows.
- Analytical processing remains isolated from operational business rules.
- The frontend does not need to know how analytics is internally processed.

---

## 🧪 Validation & Testing

### Complete Backend Suite

Validated result:

```txt
5 test suites passed
37 tests passed
```

### Targeted Node.js Analytics Suite

Validated result:

```txt
3 test suites passed
19 tests passed
```

Coverage:

```txt
Statements: 82.22%
Branches:   60.31%
Functions:  89.09%
Lines:      87.25%
```

Main coverage areas:

- authentication;
- admin-only authorization;
- analytics health endpoint;
- query filter forwarding;
- Node-to-Python contract;
- safe fallback;
- JSON export headers;
- CSV export headers;
- UTF-8 BOM;
- analytical orchestration;
- operational error propagation.

### Python Analytics Suite

Validated result:

```txt
24 tests passed
Total coverage: 96.09%
Required coverage: 80%
```

Main coverage areas:

- health endpoints;
- normalized dataset contract;
- filtered metrics;
- temporal analysis;
- inclusive final-date filtering;
- mileage filtering;
- maintenance ordering;
- empty dataset stability;
- count mismatch warnings;
- all supported export tables;
- Excel pt-BR CSV formatting;
- sensitive-field exclusion;
- CSV escaping.

### Manual Validation

The following scenarios were manually validated:

- complete historical dataset;
- vehicle filter;
- vehicle plus date period;
- department filter;
- department plus status;
- status filter;
- empty rental scope;
- one-period temporal scope;
- two-period temporal scope;
- operational statuses with small counts;
- historical statuses with larger counts;
- automatic filter updates;
- collapsed and expanded filter area;
- internal sidebar navigation;
- Python service available;
- Python service unavailable;
- recovery after restarting Python;
- JSON export;
- CSV export;
- annual demonstration dataset.

---

## ⚖️ Trade-offs and Explicit Decisions

- Python was introduced for analytical processing, not only to add another language to the stack.
- FastAPI remains behind Node.js instead of becoming a second public backend.
- Python does not access MongoDB directly.
- Analytics remains optional for the main operational workflow.
- React provides operational intelligence, while deeper BI is deferred to Power BI.
- Native React and SVG were kept instead of adding a charting dependency.
- Machine learning was intentionally excluded because deterministic analytics solves the current problem.
- Maintenance alerts represent current fleet state and are not fully constrained by historical rental filters.
- The annual dataset is simulated and explicitly documented as demonstrative.

These decisions are conscious and documented.

---

## 📂 Main Files Introduced / Modified

### Python Analytics

```txt
analytics-service/
```

### Node.js Analytics

```txt
backend/src/controllers/analyticsController.js
backend/src/routes/analyticsRoutes.js
backend/src/services/analyticsClient.js
backend/src/services/analyticsService.js
backend/jestAnalytics.config.js
```

### Backend Tests

```txt
backend/tests/http/analyticsRoutes.test.js
backend/tests/services/analyticsClient.test.js
backend/tests/services/analyticsService.test.js
```

### Annual Dataset

```txt
backend/scripts/seedAnnualPresentation.js
```

### Frontend

```txt
frontend/src/pages/adminAnalytics.js
frontend/src/services/analyticsService.js
frontend/src/components/Layout.js
frontend/src/styles/analytics.css
frontend/src/styles/layout.css
```

### Infrastructure

```txt
docker-compose.yml
backend/.env.example
```

---

## 🧠 Key Engineering Learnings

- A new service should have a clear responsibility instead of existing only for technology variety.
- Integration boundaries are easier to maintain when they exchange normalized contracts.
- A secondary analytical service needs explicit failure behavior.
- Operational analytics and business intelligence solve different problems.
- Filters should change both the data and the interpretation of the interface.
- Technical status names are not always the best product language.
- Current operational alerts may need different filtering rules from historical analysis.
- Test coverage is most useful when focused on architectural boundaries and failure modes.

---

## 🚀 Phase 13 Outcome

Before this phase, Fleet Vehicle Scheduling already handled the complete operational lifecycle of a corporate fleet.

After Phase 13, the project also includes:

- a dedicated Python analytics service;
- FastAPI integration;
- Pandas-based analytical processing;
- a normalized Node-to-Python contract;
- operational Fleet Intelligence inside React;
- contextual filtering and insights;
- temporal analysis;
- maintenance intelligence;
- Power BI-ready datasets;
- safe degraded mode;
- containerized analytics infrastructure;
- dedicated test coverage;
- a reproducible annual presentation scenario.

Phase 13 transforms the project from a fleet scheduling application into a system that can both **operate the fleet** and **interpret its operational data**.

---

## ✅ Phase 13 Completion Checklist

- [x] Analytics backend boundary implemented
- [x] Admin-only analytics access implemented
- [x] Operational dataset normalized
- [x] FastAPI analytics service created
- [x] Pandas analytics implemented
- [x] Node-to-Python integration completed
- [x] Safe fallback implemented
- [x] Fleet Intelligence dashboard created
- [x] Operational analytics UX refined
- [x] Automatic filters implemented
- [x] Temporal analysis implemented
- [x] Contextual KPIs and insights implemented
- [x] Status semantics refined
- [x] Maintenance intelligence implemented
- [x] JSON and CSV exports implemented
- [x] Power BI-ready datasets prepared
- [x] Docker Compose integration completed
- [x] Node.js analytics tests completed
- [x] Python analytics tests completed
- [x] Annual demonstration dataset added
- [x] Final documentation completed

Phase 13 is considered complete.

The project is now ready for the next analytical evolution: **Power BI reporting and deeper historical exploration**.
