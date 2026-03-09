# Fleet Vehicle Scheduling

Full-stack fleet rental and vehicle scheduling system built with **Node.js, Express, MongoDB, and React**.

The project focuses on **software architecture, separation of concerns, and progressive system evolution**, simulating how a real production system grows over time. Instead of implementing everything at once, the system is built through **incremental engineering phases**, each introducing new architectural capabilities.

---

## 🎯 Project Goals

This project was created as a full-stack architecture learning exercise, with a strong emphasis on backend system design. The goals of the project are:

* Practice layered backend architecture
* Implement separation between transport, business rules, and persistence
* Build authentication flows used in real SaaS systems
* Design a scalable codebase that evolves in phases
* Demonstrate clean architecture thinking in interviews

> The focus is engineering quality over feature speed.

---

## 🔎 System Overview

Fleet Vehicle Scheduling is designed to manage:

* vehicle fleets
* rental requests
* scheduling of resources
* administrative approval workflows
* reservation lifecycle management
* role-based user access

The project follows a **backend-first development strategy**, where the API and business logic are implemented before the UI layer.

---

## 🏗️ Architecture

The backend follows a layered architecture designed to isolate responsibilities. Each layer has a strict responsibility boundary, ensuring clear separation between transport and business logic.

**Request Flow:**  
`Route → Controller → Service → Database Model`

### Layer Responsibilities

| Layer | Responsibility | Examples |
| :--- | :--- | :--- |
| **Routes** | Defining API endpoints and mapping incoming HTTP requests. | `POST /api/auth/login`, `GET /api/vehicles` |
| **Controllers** | Handling HTTP concerns (request parsing, validation, response formatting). | Calling services, returning standard HTTP codes. Must not contain business rules. |
| **Services** | Executing application business logic (no HTTP dependencies). | `createRental()`, `approveRequest()`, `cancelRequest()`, `authenticateUser()` |
| **Models** | Defining database schemas using Mongoose and handling persistence. | Schema definition, database interaction. |

### Backend Architecture Principles

* **Service Isolation:** Business rules live exclusively inside Services, not Controllers.
* **Thin Controllers:** Controllers act as coordinators between HTTP and the Service layer.
* **Standardized Errors:** Errors are handled through a centralized `AppError` system, ensuring consistent responses.
* **Validation Split:** Request shape is validated by middleware, while business rules are enforced in Services.
* **Lifecycle Protection:** Reservation transitions are validated explicitly, preventing invalid status changes.

---

## 🖥️ Frontend Architecture

The frontend is implemented using **React**. Its core responsibilities include authentication, protected navigation, dashboard rendering, API consumption, and workflow interaction.

### Authentication System

Authentication is implemented using JWT tokens and maintained using React Context (`AuthContext`).

* **Login Flow:** Frontend sends credentials → Backend validates → JWT token generated → Token returned and stored in `localStorage`
* **Session Persistence:** State is managed globally, handling login, logout, and session restoration
* **Axios Interceptor:** All API requests pass through a centralized Axios instance. It automatically injects the JWT and triggers a logout on a 401 failure

### Routing & Layout

* **Protected Routes:** The `PrivateRoute` component ensures unauthenticated users are redirected to `/login`, while authenticated users gain access
* **Role-Based Navigation:** Users are redirected depending on their role (admins to `/admin`, standard users to `/user`)
* **Layout System:** A reusable `Layout` component provides shared UI elements like navigation, logout, and dashboard structure
* **Role-Specific Reservation Screens:** The system now separates user and admin reservation flows:
  * `/rentals` → user reservation history and cancellation
  * `/admin/rentals` → administrative approval/rejection queue

---

## 📂 Project Structure

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
    │   ├── scripts/
    │   │   ├── list-users.js
    │   │   ├── reset-admin-password.js
    │   │   ├── seed-user.js
    │   │   ├── seed-common-user.js
    │   │   ├── seed-vehicle.js
    │   │   ├── seed-rental.js
    │   │   ├── smoke-vehicle.js
    │   │   └── smoke-rental.js
    │   ├── server.js
    │   └── .env.example
    │
    ├── frontend/src/
    │   ├── components/
    │   │   ├── Layout.js
    │   │   ├── PrivateRoute.js
    │   │   ├── AdminRentalTable.js
    │   │   └── RentalForm.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── login.js
    │   │   ├── adminDashboard.js
    │   │   ├── adminRentals.js
    │   │   ├── userDashboard.js
    │   │   └── rentals.js
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   ├── global.css
    │   │   ├── layout.css
    │   │   ├── login.css
    │   │   └── dashboard.css
    │   ├── App.js
    │   └── index.js
    │
    ├── docs/
    │   ├── phase-1.md
    │   ├── phase-2.md
    │   ├── phase-3.md
    │   ├── phase-4.md
    │   ├── phase-5.md
    │   ├── phase-6.md
    │   ├── phase-7.md
    │   └── template.md
    │
    └── README.md

---

## 🛠️ Development Utilities

Helper scripts were created for development debugging and sanity checks:

* **List users:** Displays all registered users in the database  
  `node backend/scripts/list-users.js`

* **Reset admin password:** Allows manual password reset for development accounts  
  `node backend/scripts/reset-admin-password.js <email> <newPassword>`

* **Vehicle smoke test:** Validates maintenance rules without HTTP  
  `node backend/scripts/smoke-vehicle.js`

* **Rental smoke test:** Validates reservation lifecycle without HTTP  
  `node backend/scripts/smoke-rental.js`

---

## 🚀 Engineering Phases

The system evolves through incremental architectural phases:

* **Phase 1 — Foundation:** System initialization, Express server setup, MongoDB connection, project structure, and environment configuration
* **Phase 2 — Services Layer:** Business logic centralization, Services layer introduced, Controllers simplified, and `AppError` error system created
* **Phase 3 — HTTP Layer & Security:** Backend API completion, REST routes implemented, controllers handling HTTP flow, JWT authentication, role-based access control, and request validation
* **Phase 4 — Frontend Foundation:** React application setup, JWT authentication integration, protected routes, role-based navigation, dashboard layout, and session persistence
* **Phase 5 — Rental Workflow:** Complete rental request workflow, including creation, user listing, admin management, approval/rejection system, and dashboard synchronization
* **Phase 6 — Reservation Rules:** Date conflict protection, vehicle availability checks, lifecycle rules, cancellation semantics, and local-date validation
* **Phase 7 — UX Polish:** Defensive UI improvements, clearer error handling, admin operational queue, loading states, empty states, and separation between admin and user reservation flows

---

## ⚙️ Current System Capabilities

The system currently supports:

* User authentication with JWT session persistence
* Role-based dashboards and protected routes
* Layered backend architecture
* Vehicle rental request creation
* Administrative approval and rejection workflows
* Reservation cancellation for approved requests
* Scheduling conflict protection for approved reservations
* Lifecycle validation for reservation status transitions
* Defensive frontend UX with loading, empty, and error states

---

## ✅ Reservation Lifecycle

The reservation workflow now behaves like a real operational system:

1. User creates a reservation request
2. Request starts as `pending`
3. Admin reviews the request in the dedicated admin queue
4. Admin can `approve` or `reject`
5. Approved reservations block scheduling conflicts for the same vehicle and period
6. User can cancel an `approved` reservation
7. Invalid lifecycle transitions are rejected by the backend

Example protected rule:

> An approved reservation prevents another overlapping reservation from being approved for the same vehicle.

---

## 🔮 Current Phase

**Phase 8 — Deploy, Hardening & Production Readiness**

The project is now entering the deployment phase. The next step is to prepare the system for a real published environment, including:

* backend deployment
* frontend deployment
* MongoDB Atlas production integration
* environment variable review
* production-safe CORS and secret configuration
* basic hardening and readiness validation

---

## 💻 Technology Stack

| Environment | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, Zod |
| **Frontend** | React, React Router, Axios, Context API |
| **Tooling** | ESLint, Prettier, Nodemon, Git, GitHub |

---

## 🧠 Learning Focus

This project intentionally prioritizes architecture and engineering practices over rapid feature delivery. Key learning areas include:

* layered backend design
* separation of concerns
* authentication and authorization flows
* API design
* reservation lifecycle modeling
* scheduling conflict validation
* frontend/backend boundary discipline
* scalable project structure
* progressive system hardening

---

## 👨‍💻 Author

**Eduardo Henrique**  
Full-stack developer focused on backend architecture, system design, and scalable APIs.
