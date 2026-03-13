# Fleet Vehicle Scheduling

> Full-stack fleet rental and vehicle scheduling system built with **Node.js**, **Express**, **MongoDB**, and **React**.

The project focuses on software architecture, separation of concerns, and progressive system evolution — simulating how real production systems grow over time. Instead of implementing everything at once, the system was built through **incremental engineering phases**, each introducing new architectural capabilities while preserving the existing foundation.

---

## Live System

| Service | URL |
|---|---|
| Frontend (Vercel) | https://fleet-vehicle-scheduling.vercel.app |
| Backend API (Render) | https://fleet-vehicle-scheduling.onrender.com |
| Health Check | https://fleet-vehicle-scheduling.onrender.com/api/health |

---

## Tech Stack

| Category | Stack |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| ORM | Mongoose |
| Authentication | JWT |
| Frontend | React |
| Routing | React Router |
| API Client | Axios |
| Hosting | Render |
| Frontend Hosting | Vercel |
| Testing | Jest, Supertest, MongoMemoryServer |
| CI | GitHub Actions |
| Containerization | Docker, Docker Compose |
| Tooling | ESLint, Prettier, Nodemon |

---

## Running Locally with Docker

Starting in Phase 12, the project includes a containerized local development environment via Docker Compose.

```bash
# Start everything (frontend + backend)
docker compose up --build

# Stop containers
docker compose down
```

| Service | Local URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

A new developer can get the full system running with just:

```bash
git clone <repository>
docker compose up
```

No manual Node.js installation or dependency setup required.

---

## System Architecture

```
React (Vercel)
      ↓
Node.js API (Render)
      ↓
MongoDB Atlas
```

| Layer | Responsibility |
|---|---|
| Frontend (React) | User interface, authentication flow, dashboards, workflow interaction |
| Backend (Node.js / Express) | Business logic, reservation lifecycle, authentication, validation |
| Database (MongoDB Atlas) | Persistent storage for users, vehicles, and reservations |

---

## Backend Architecture

The backend follows a strict layered architecture designed to isolate responsibilities.

**Request flow:**

```
Route → Controller → Service → Database Model
```

| Layer | Responsibility | Examples |
|---|---|---|
| Routes | Defines API endpoints | `POST /api/auth/login` |
| Controllers | Handles HTTP concerns | Request parsing, response formatting |
| Services | Business logic | `createRental()`, `approveRequest()` |
| Models | Database schemas | Mongoose schemas |

**Design principles:**

- **Service isolation** — Business rules live exclusively inside Services
- **Thin controllers** — Controllers orchestrate calls but contain no business logic
- **Standardized errors** — Centralized `AppError` system ensures consistent API responses
- **Validation split** — Request structure validated in middleware; business rules in services
- **Lifecycle protection** — Reservation state transitions are validated explicitly

---

## Fleet Lifecycle Model

```
Vehicle Available
       ↓
Reservation Requested
       ↓
Admin Approval
       ↓
Vehicle In Use
       ↓
Return Request (Mileage Submitted)
       ↓
Admin Confirmation
       ↓
Mileage Update → Maintenance Check
```

If return mileage exceeds the maintenance threshold, the vehicle automatically moves to **maintenance status**.

---

## Testing

```bash
npm test
```

**Test stack:** Jest · Supertest · MongoMemoryServer

```
backend/tests/
├── helpers/
│   └── appErrorAssert.js
├── http/
│   └── rentalRoutes.test.js
└── services/
    └── rentalService.test.js
```

Covered flows: rental request creation, admin approval workflow, cancellation rules, return lifecycle, mileage validation, maintenance threshold logic, HTTP endpoint validation.

---

## CI Pipeline

Runs automatically on every push and pull request via GitHub Actions (`.github/workflows/backend-ci.yml`).

```
npm ci → npm run lint → npm test
```

---

## Observability (Phase 11)

Every request is logged with a correlation ID for end-to-end tracing:

```
[2026-03-13T12:15:53.590Z] [req:54bd0435] [ip:127.0.0.1] GET /api/vehicles 200 19ms
```

Additional features: structured JSON error logging, API rate limiting (HTTP 429 on threshold breach), reverse proxy support, and an enhanced `/api/health` endpoint exposing service metadata (name, version, environment, uptime, requestId).

---

## Project Structure

```
fleet-vehicle-scheduling/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   ├── scripts/
│   ├── Dockerfile
│   ├── jest.config.js
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── styles/
└── docs/
    ├── phase-1.md
    ├── ...
    └── phase-12.md
```

---

## Engineering Phases

| Phase | Focus |
|---|---|
| Phase 1 | Backend foundation and environment setup |
| Phase 2 | Services layer and business logic centralization |
| Phase 3 | HTTP API, authentication, validation |
| Phase 4 | React frontend foundation |
| Phase 5 | Rental request workflow |
| Phase 6 | Reservation lifecycle rules |
| Phase 7 | UX improvements and admin workflow |
| Phase 8 | Production deployment |
| Phase 9 | Fleet lifecycle management |
| Phase 10 | Backend testing and CI pipeline |
| Phase 11 | Observability and operational diagnostics |
| Phase 12 | Docker containerization and local infrastructure |

---

## Current Capabilities

- JWT authentication and role-based dashboards
- Vehicle rental request creation
- Admin approval and rejection workflows
- Reservation cancellation and scheduling conflict protection
- Full fleet lifecycle and mileage tracking
- Automatic maintenance lifecycle transitions
- Automated backend tests and CI pipeline
- Structured request logging with correlation IDs
- API rate limiting
- Operational health diagnostics
- Containerized local development environment

---

## Author

**Eduardo Henrique** — Full-stack developer focused on backend architecture, system design, scalable APIs, and production-ready applications.

If you found this project useful, consider giving the repository a ⭐