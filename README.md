# Fleet Vehicle Scheduling

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![CI](https://github.com/Eduhn26/Fleet-Vehicle-Scheduling/actions/workflows/backend-ci.yml/badge.svg)
![License](https://img.shields.io/badge/License-MIT-blue)

Full-stack platform for fleet rental and vehicle scheduling — built with **Node.js, Express, MongoDB, and React**.

The project isn't just a CRUD app. It was built through **10 incremental engineering phases**, each introducing new architectural layers while keeping previous ones intact. The goal was to simulate how real production systems grow — messy, evolving, and under pressure.

---

## Live

| Service | URL |
|---|---|
| Frontend | https://fleet-vehicle-scheduling.vercel.app |
| Backend API | https://fleet-vehicle-scheduling.onrender.com |
| Health Check | https://fleet-vehicle-scheduling.onrender.com/api/health |

---

## What it does

Fleet Vehicle Scheduling manages the full operational lifecycle of a vehicle fleet:

- Vehicle registration and availability tracking
- Rental request creation by users
- Admin approval/rejection workflows
- Scheduling conflict protection
- Vehicle return with mileage submission
- Automatic maintenance triggers based on mileage thresholds
- Role-based dashboards for users and administrators

The core design decision: **business logic lives exclusively in the service layer**, not in routes or controllers.

---

## Architecture

```
React (Vercel)  →  Node.js API (Render)  →  MongoDB Atlas
```

### Request flow

```
Route → Controller → Service → Model
```

| Layer | Responsibility |
|---|---|
| Routes | Define API surface |
| Controllers | Parse requests, format responses |
| Services | Business rules — the only place decisions are made |
| Models | Mongoose schemas and database interaction |

### Design principles

- **Thin controllers** — no business logic leaks into HTTP handlers
- **Service isolation** — `createRental()`, `approveRequest()`, `confirmReturn()` are self-contained
- **Centralized errors** — `AppError` system produces consistent API responses
- **Validation split** — request shape validated in middleware, business rules validated in services
- **Lifecycle protection** — reservation state transitions are explicitly validated

---

## Tech stack

| Area | Tech |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT |
| Frontend | React, React Router, Axios |
| Testing | Jest, Supertest, MongoMemoryServer |
| CI | GitHub Actions |
| Hosting | Vercel (frontend), Render (backend) |
| Tooling | ESLint, Prettier, Nodemon |

---

## Vehicle lifecycle

```
Available
  → Reservation Requested
  → Admin Approval
  → In Use
  → Return Requested (mileage submitted)
  → Admin Confirms Return
  → Mileage Updated
  → Maintenance Check
       ↓ (if threshold exceeded)
  → Maintenance Status
```

---

## Testing

Backend tests cover the critical paths of the reservation lifecycle.

```
backend/tests/
├── helpers/
│   └── appErrorAssert.js
├── http/
│   └── rentalRoutes.test.js
└── services/
    └── rentalService.test.js
```

Coverage includes:
- rental request creation
- approval workflow
- cancellation rules
- return flow and mileage validation
- maintenance threshold logic
- HTTP endpoint contracts

```bash
npm test
```

---

## CI pipeline

Every push and pull request runs the full backend validation suite automatically via GitHub Actions:

```bash
npm ci
npm run lint
npm test
```

---

## Project structure

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
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── styles/
└── docs/
    └── phase-1.md → phase-10.md
```

---

## Development scripts

```bash
# List users
node backend/scripts/list-users.js

# Reset admin password
node backend/scripts/reset-admin-password.js <email> <newPassword>

# Smoke test: vehicles
node backend/scripts/smoke-vehicle.js

# Smoke test: rentals
node backend/scripts/smoke-rental.js
```

---

## Engineering phases

| Phase | Focus |
|---|---|
| 1 | Backend foundation and environment setup |
| 2 | Services layer and business logic centralization |
| 3 | HTTP API, authentication, validation |
| 4 | React frontend foundation |
| 5 | Rental request workflow |
| 6 | Reservation lifecycle rules |
| 7 | UX improvements and admin workflow |
| 8 | Production deployment |
| 9 | Fleet lifecycle management |
| 10 | Backend test automation and CI |

Full documentation for each phase in `/docs`.

---

## About

Built by **Eduardo Henrique** as an architecture learning project — not to ship features fast, but to practice how real software systems are structured, evolved, and hardened over time.

The emphasis is on backend engineering: layered architecture, separation of concerns, lifecycle modeling, and the discipline of keeping business logic where it belongs.
