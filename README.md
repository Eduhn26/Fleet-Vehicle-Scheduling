<div align="center">

# 🚗 Fleet Vehicle Scheduling

**Full-stack fleet rental and vehicle scheduling system**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**Live Demo**](https://fleet-vehicle-scheduling.vercel.app) · [**API**](https://fleet-vehicle-scheduling.onrender.com) · [**Health Check**](https://fleet-vehicle-scheduling.onrender.com/api/health)

</div>

---

## 📋 Overview

A production-grade fleet management system built to demonstrate **real-world software engineering practices** — layered architecture, progressive system evolution, CI/CD pipelines, observability, and containerized deployment.

Instead of implementing everything at once, the system was built through **12 incremental engineering phases**, each introducing new architectural capabilities while preserving the existing foundation — simulating how production systems actually grow over time.

---

## 🌐 Live System

| Service | URL |
|---|---|
| 🖥️ Frontend | https://fleet-vehicle-scheduling.vercel.app |
| ⚙️ Backend API | https://fleet-vehicle-scheduling.onrender.com |
| 🩺 Health Check | https://fleet-vehicle-scheduling.onrender.com/api/health |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Backend** | Node.js, Express |
| **Database** | MongoDB Atlas |
| **ORM** | Mongoose |
| **Authentication** | JWT |
| **Frontend** | React, React Router |
| **API Client** | Axios |
| **Testing** | Jest, Supertest, MongoMemoryServer |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker, Docker Compose |
| **Hosting** | Render (API) · Vercel (Frontend) |
| **Tooling** | ESLint, Prettier, Nodemon |

---

## ⚡ Quick Start (Docker)

Get the full system running with a single command — no Node.js installation required.

```bash
git clone <repository-url>
cd fleet-vehicle-scheduling
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

```bash
# Stop containers
docker compose down
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│         React  (Vercel)             │  ← User Interface
└────────────────┬────────────────────┘
                 │ HTTPS / Axios
┌────────────────▼────────────────────┐
│      Node.js + Express  (Render)    │  ← Business Logic & API
└────────────────┬────────────────────┘
                 │ Mongoose
┌────────────────▼────────────────────┐
│         MongoDB Atlas               │  ← Persistent Storage
└─────────────────────────────────────┘
```

| Layer | Responsibility |
|---|---|
| **Frontend (React)** | User interface, auth flow, dashboards, workflow interaction |
| **Backend (Express)** | Business logic, reservation lifecycle, authentication, validation |
| **Database (MongoDB)** | Persistent storage for users, vehicles, and reservations |

---

## 🧱 Backend Architecture

The backend follows a **strict layered architecture** that isolates responsibilities across four layers:

```
HTTP Request
     │
     ▼
  Routes          →  Defines API endpoints
     │
     ▼
Controllers       →  Parses request, formats response
     │
     ▼
  Services        →  All business logic lives here
     │
     ▼
   Models         →  Mongoose schemas & database access
```

| Layer | Responsibility | Example |
|---|---|---|
| **Routes** | Endpoint definitions | `POST /api/auth/login` |
| **Controllers** | HTTP orchestration | Request parsing, response formatting |
| **Services** | Business rules | `createRental()`, `approveRequest()` |
| **Models** | Database schemas | Mongoose schemas |

### Design Principles

- **Service isolation** — Business rules live exclusively inside Services; never in Controllers or Routes
- **Thin controllers** — Controllers orchestrate calls but contain zero business logic
- **Standardized errors** — Centralized `AppError` class ensures consistent API error responses
- **Validation split** — Request structure validated in middleware; domain rules validated in services
- **Lifecycle protection** — Every reservation state transition is validated explicitly before execution

---

## 🔄 Fleet Lifecycle Model

Vehicles follow a well-defined lifecycle with explicit, validated state transitions:

```
                ┌─────────────────┐
                │  Available      │
                └────────┬────────┘
                         │ User requests
                ┌────────▼────────┐
                │ Reservation     │
                │ Requested       │
                └────────┬────────┘
                         │ Admin approves
                ┌────────▼────────┐
                │   In Use        │
                └────────┬────────┘
                         │ User submits mileage
                ┌────────▼────────┐
                │ Return          │
                │ Requested       │
                └────────┬────────┘
                         │ Admin confirms
                ┌────────▼────────┐
                │ Mileage Update  │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              │ threshold OK?       │
        ┌─────▼──────┐      ┌───────▼───────┐
        │ Available  │      │  Maintenance  │
        └────────────┘      └───────────────┘
```

> If return mileage **exceeds the maintenance threshold**, the vehicle is automatically transitioned to **Maintenance** status.

---

## 🧪 Testing

```bash
npm test
```

**Test stack:** Jest · Supertest · MongoMemoryServer (in-memory MongoDB for isolated tests)

```
backend/tests/
├── helpers/
│   └── appErrorAssert.js       # Custom error assertion helpers
├── http/
│   └── rentalRoutes.test.js    # HTTP endpoint integration tests
└── services/
    └── rentalService.test.js   # Business logic unit tests
```

**Coverage:**

- Rental request creation
- Admin approval and rejection workflows
- Cancellation rules and scheduling conflict protection
- Return lifecycle and mileage validation
- Maintenance threshold logic
- HTTP endpoint request/response validation

---

## 🔁 CI Pipeline

Runs automatically on every **push** and **pull request** via GitHub Actions.

```yaml
# .github/workflows/backend-ci.yml
npm ci → npm run lint → npm test
```

All three stages must pass before a branch can be merged.

---

## 📡 Observability

Every HTTP request is logged with a **correlation ID** for end-to-end tracing:

```
[2026-03-13T12:15:53.590Z] [req:54bd0435] [ip:127.0.0.1] GET /api/vehicles 200 19ms
```

**Additional operational features:**

- Structured JSON error logging for machine-readable diagnostics
- API rate limiting with HTTP `429` responses on threshold breach
- Reverse proxy support with trusted header forwarding
- Enhanced `/api/health` endpoint exposing service metadata (name, version, environment, uptime, requestId)

---

## 📁 Project Structure

```
fleet-vehicle-scheduling/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment and database configuration
│   │   ├── controllers/      # HTTP request/response handlers
│   │   ├── middleware/       # Auth, validation, logging, rate limiting
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API endpoint definitions
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # Shared utilities (AppError, logger)
│   │   └── validators/       # Request structure validators
│   ├── tests/                # Jest test suites
│   ├── scripts/              # Utility and seed scripts
│   ├── Dockerfile
│   ├── jest.config.js
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # React context (Auth, etc.)
│       ├── pages/            # Page-level views
│       ├── services/         # Axios API client wrappers
│       └── styles/           # Global and component CSS
└── docs/
    ├── phase-1.md
    ├── ...
    └── phase-12.md           # Full phase-by-phase engineering journal
```

---

## 🎯 Current Capabilities

| Feature | Status |
|---|---|
| JWT authentication and role-based dashboards | ✅ |
| Vehicle rental request creation | ✅ |
| Admin approval and rejection workflows | ✅ |
| Reservation cancellation with conflict protection | ✅ |
| Full fleet lifecycle and mileage tracking | ✅ |
| Automatic maintenance lifecycle transitions | ✅ |
| Automated backend tests and CI pipeline | ✅ |
| Structured request logging with correlation IDs | ✅ |
| API rate limiting | ✅ |
| Operational health diagnostics | ✅ |
| Containerized local development (Docker) | ✅ |
| Fully responsive UI across mobile devices | ✅ |

---

## 📐 Engineering Phases

| Phase | Focus |
|---|---|
| **Phase 1** | Backend foundation and environment setup |
| **Phase 2** | Services layer and business logic centralization |
| **Phase 3** | HTTP API, authentication, validation |
| **Phase 4** | React frontend foundation |
| **Phase 5** | Rental request workflow |
| **Phase 6** | Reservation lifecycle rules |
| **Phase 7** | UX improvements and admin workflow |
| **Phase 8** | Production deployment |
| **Phase 9** | Fleet lifecycle management |
| **Phase 10** | Backend testing and CI pipeline |
| **Phase 11** | Observability and operational diagnostics |
| **Phase 12** | Docker containerization and local infrastructure |

Each phase has a corresponding document in `/docs/` detailing the decisions, architecture changes, and lessons learned.

---

## 👤 Author

**Eduardo Henrique** — Full-stack developer focused on backend architecture, system design, scalable APIs, and production-ready applications.

If this project was useful to you, consider giving it a ⭐ on GitHub.
