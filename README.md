# Fleet Vehicle Scheduling

![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![CI](https://github.com/Eduhn26/Fleet-Vehicle-Scheduling/actions/workflows/backend-ci.yml/badge.svg)
![Deployment](https://img.shields.io/badge/Deployment-Render%20%7C%20Vercel-black)
![License](https://img.shields.io/badge/License-MIT-blue)

Full-stack fleet rental and vehicle scheduling platform built with **Node.js, Express, MongoDB, and React**.

The project focuses on **backend architecture, lifecycle modeling, and progressive engineering evolution**, simulating how real production systems grow over time.

Instead of implementing everything at once, the system was built through **incremental engineering phases**, each introducing new architectural capabilities while preserving system stability.

---

## 🚀 Live System

| Service | URL |
|---|---|
| Frontend (Vercel) | https://fleet-vehicle-scheduling.vercel.app |
| Backend API (Render) | https://fleet-vehicle-scheduling.onrender.com |
| Health Check | https://fleet-vehicle-scheduling.onrender.com/api/health |

---

## 🧠 System Architecture

The application is deployed using a modern full-stack cloud architecture.

`React (Vercel) ↓ Node.js API (Render) ↓ MongoDB Atlas`

| Layer | Responsibility |
|---|---|
| Frontend (React) | User interface, authentication flow, dashboards, workflow interaction |
| Backend (Node.js / Express) | Business logic, reservation lifecycle, authentication, validation |
| Database (MongoDB Atlas) | Persistent storage for users, vehicles, and reservations |
| Cloud Hosting | Vercel (frontend), Render (API), Atlas (database) |

---

## ⚡ Tech Stack

| Category | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| ORM | Mongoose |
| Authentication | JWT |
| Frontend | React |
| Routing | React Router |
| API Client | Axios |
| Testing | Jest, Supertest |
| CI | GitHub Actions |
| Hosting | Render, Vercel |
| Tooling | ESLint, Prettier, Nodemon |

---

## 🧪 Testing & Quality Assurance

The backend includes automated tests to protect critical business rules and API contracts.

Testing stack:
- **Jest** — unit and service testing
- **Supertest** — HTTP integration tests
- **MongoMemoryServer** — isolated database for testing

Test coverage includes:
- rental request lifecycle
- approval workflow
- cancellation rules
- return workflow
- mileage validation
- maintenance threshold logic
- HTTP endpoint validation

Test structure:
```text
backend/tests
├── helpers
│   └── appErrorAssert.js
├── http
│   └── rentalRoutes.test.js
└── services
    └── rentalService.test.js
```

These tests ensure that the **business logic remains correct regardless of transport or UI changes**.

---

## 🤖 Continuous Integration

The project includes an automated **GitHub Actions CI pipeline** to validate backend quality.

Pipeline steps:
1. Install dependencies
2. Run ESLint
3. Execute automated tests

```bash
npm ci
npm run lint
npm test
```

The pipeline runs automatically on:
- push
- pull requests

This ensures every backend change is **automatically verified before integration**.

---

## 🎯 Project Goals

This project was created as a full-stack architecture learning exercise with a strong emphasis on backend engineering.

Main goals:
- practice layered backend architecture
- implement clear separation of concerns
- build real authentication flows
- simulate SaaS backend design
- design a codebase that evolves through engineering phases
- demonstrate clean architecture thinking

> The focus is **engineering quality over feature speed.**

---

## 🧩 Why This Project Exists

Most tutorials focus on isolated features.

This project focuses on **system evolution and architectural discipline**.

Instead of implementing everything at once, the system was built through **incremental engineering phases**, simulating how real software evolves in production environments.

Each phase introduced new architectural capabilities while preserving previous layers.

---

## 🔎 System Overview

Fleet Vehicle Scheduling manages:
- vehicle fleets
- rental requests
- resource scheduling
- administrative approval workflows
- reservation lifecycle management
- role-based user access
- vehicle mileage tracking
- vehicle maintenance lifecycle

The project follows a **backend-first development strategy**, where the API and business logic are implemented before the UI layer.

---

## 🏗️ Backend Architecture

The backend follows a layered architecture designed to isolate responsibilities.

### Request Flow
`Route → Controller → Service → Database Model`

### Layer Responsibilities

| Layer | Responsibility | Examples |
|---|---|---|
| Routes | Defines API endpoints | `POST /api/auth/login` |
| Controllers | Handles HTTP concerns | request parsing, response formatting |
| Services | Business logic | `createRental()`, `approveRequest()` |
| Models | Database schemas | Mongoose schemas |

---

### Backend Design Principles

**Service Isolation**
Business rules live exclusively inside Services.

**Thin Controllers**
Controllers orchestrate calls but do not contain business logic.

**Standardized Errors**
Centralized `AppError` system ensures consistent API responses.

**Validation Split**
- Request structure → validated in middleware
- Business rules → validated in Services

**Lifecycle Protection**
Reservation transitions are validated explicitly to prevent invalid state changes.

---

## 🖥️ Frontend Architecture

The frontend is implemented with React and focuses on authentication, dashboards, and workflow interaction.

Core responsibilities:
- authentication flow
- protected routes
- role-based dashboards
- API consumption
- workflow interaction
- fleet visualization dashboards
- operational UI for administrators

---

### Authentication System

Authentication uses **JWT tokens**.

#### Login Flow
`User login ↓ Backend validates credentials ↓ JWT token issued ↓ Token stored in localStorage ↓ Axios attaches token to future requests`

Session state is managed through **React Context (`AuthContext`)**.

---

### Routing & Navigation

| Feature | Description |
|---|---|
| PrivateRoute | Prevents access to protected pages |
| Role-Based Navigation | Admin vs User dashboards |
| Central Layout | Shared UI components |
| Axios Interceptors | Injects JWT and handles 401 logout |

---

## 🚗 Fleet Lifecycle Model

The system models the **complete operational lifecycle of fleet vehicles**.

`Vehicle Available ↓ Reservation Requested ↓ Admin Approval ↓ Vehicle In Use ↓ Return Request (Mileage Submitted) ↓ Admin Confirmation ↓ Mileage Update ↓ Maintenance Check`

If the return mileage exceeds the maintenance threshold, the vehicle automatically moves to **maintenance status**.

---

## 📂 Project Structure

```text
fleet-vehicle-scheduling/
│
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
│   │
│   ├── tests/
│   │   ├── helpers/
│   │   ├── http/
│   │   └── services/
│   │
│   ├── scripts/
│   │   ├── seed-user.js
│   │   ├── seed-vehicle.js
│   │   ├── seed-rental.js
│   │   ├── smoke-vehicle.js
│   │   └── smoke-rental.js
│   │
│   ├── server.js
│   ├── jest.config.js
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── styles/
│
├── docs/
│   ├── phase-1.md
│   ├── phase-2.md
│   ├── phase-3.md
│   ├── phase-4.md
│   ├── phase-5.md
│   ├── phase-6.md
│   ├── phase-7.md
│   ├── phase-8.md
│   ├── phase-9.md
│   └── phase-10.md
│
└── README.md
```

---

## 🛠 Development Utilities

Helper scripts exist for debugging and development.

**List users**
```bash
node backend/scripts/list-users.js
```

**Reset admin password**
```bash
node backend/scripts/reset-admin-password.js <email> <newPassword>
```

**Vehicle smoke test**
```bash
node backend/scripts/smoke-vehicle.js
```

**Rental smoke test**
```bash
node backend/scripts/smoke-rental.js
```

---

## 🚀 Engineering Phases

The system evolved through incremental architectural phases.

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
| Phase 10 | Engineering hardening, automated tests and CI |

---

## ⚙️ Current Capabilities

The system currently supports:
- JWT authentication
- role-based dashboards
- vehicle rental request creation
- admin approval/rejection workflows
- reservation cancellation
- scheduling conflict protection
- lifecycle validation
- defensive frontend UX states
- vehicle fleet management
- vehicle maintenance lifecycle
- vehicle mileage tracking
- return workflow with administrative confirmation
- automated backend tests
- CI validation pipeline

---

## 🧠 Learning Focus

This project prioritizes architecture and engineering practices over rapid feature delivery.

Focus areas:
- layered backend architecture
- separation of concerns
- authentication and authorization
- API design
- lifecycle modeling
- scheduling conflict validation
- fleet lifecycle management
- operational dashboards
- scalable project structure
- real production deployment
- backend test automation
- CI/CD engineering practices

---

## 👨‍💻 Author

**Eduardo Henrique** Full-stack developer focused on backend architecture, system design, scalable APIs, and production-ready applications.

⭐ *If you found this project interesting, consider giving the repository a star.*
