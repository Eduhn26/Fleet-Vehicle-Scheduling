# Fleet Vehicle Scheduling

Full-stack fleet rental and vehicle scheduling system built with Node.js, Express, MongoDB, and React.

The project focuses on software architecture, separation of concerns, and progressive system evolution, simulating how a real production system grows over time. Instead of implementing everything at once, the system is built through incremental engineering phases, each introducing new architectural capabilities.

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

Fleet Vehicle Scheduling is designed to manage vehicle fleets, rental requests, scheduling of resources, administrative approval workflows, and role-based user access.

The project follows a backend-first development strategy, where the API and business logic are implemented before the UI layer.

---

## 🏗️ Architecture



The backend follows a layered architecture designed to isolate responsibilities. Each layer has a strict responsibility boundary, ensuring clear separation between transport and business logic.

**Request Flow:** Route → Controller → Service → Database Model

### Layer Responsibilities

| Layer | Responsibility | Examples |
| :--- | :--- | :--- |
| **Routes** | Defining API endpoints and mapping incoming HTTP requests. | `POST /api/auth/login`, `GET /api/vehicles` |
| **Controllers** | Handling HTTP concerns (request parsing, validation, response formatting). | Calling services, returning standard HTTP codes. Must not contain business rules. |
| **Services** | Executing application business logic (no HTTP dependencies). | `createRental()`, `validateVehicleAvailability()`, `authenticateUser()` |
| **Models** | Defining database schemas using Mongoose and handling persistence. | Schema definition, database interaction. |

### Backend Architecture Principles

* **Service Isolation:** Business rules live exclusively inside Services, not Controllers.
* **Thin Controllers:** Controllers act as coordinators between HTTP and the Service layer.
* **Standardized Errors:** Errors are handled through a centralized `AppError` system, ensuring consistent responses.

---

## 🖥️ Frontend Architecture

The frontend is implemented using React. Its core responsibilities include authentication, protected navigation, dashboard rendering, API consumption, and workflow interaction.

### Authentication System



Authentication is implemented using JWT tokens and maintained using React Context (`AuthContext`).

* **Login Flow:** Frontend sends credentials → Backend validates → JWT token generated → Token returned and stored in `localStorage`.
* **Session Persistence:** State is managed globally, handling login, logout, and session restoration.
* **Axios Interceptor:** All API requests pass through a centralized Axios instance. It automatically injects the JWT and triggers a logout on a 401 failure.

### Routing & Layout

* **Protected Routes:** The `PrivateRoute` component ensures unauthenticated users are redirected to `/login`, while authenticated users gain access.
* **Role-Based Navigation:** Users are redirected depending on their role (e.g., admins to `/admin`, standard users to `/user`), separating administrative features from normal workflows.
* **Layout System:** A reusable `Layout` component provides shared UI elements like the navigation bar, logout button, and dashboard structure.

---

## 📂 Project Structure

```text
fleet-vehicle-scheduling/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── scripts/
│       ├── list-users.js
│       └── reset-password.js
└── frontend/src/
    ├── components/
    │   ├── Layout.js
    │   ├── PrivateRoute.js
    │   ├── AdminRentalTable.js
    │   └── RentalForm.js
    ├── context/
    │   └── AuthContext.js
    ├── pages/
    │   ├── login.js
    │   ├── adminDashboard.js
    │   ├── userDashboard.js
    │   └── rentals.js
    ├── services/
    │   └── api.js
    ├── styles/
    │   ├── global.css
    │   ├── layout.css
    │   ├── login.css
    │   └── dashboard.css
    ├── App.js
    └── index.js
🛠️ Development UtilitiesTwo helper scripts were created for development debugging:List users: Displays all registered users in the database.node backend/scripts/list-users.jsReset password: Allows manual password reset for development accounts.node backend/scripts/reset-password.js🚀 Engineering PhasesThe system evolves through incremental architectural phases:Phase 1 — Foundation: System initialization, Express server setup, MongoDB connection, project structure, and environment configuration.Phase 2 — Services Layer: Business logic centralization, Services layer introduced, Controllers simplified, and AppError error system created.Phase 3 — HTTP Layer & Security: Backend API completion, REST routes implemented, controllers handling HTTP flow, JWT authentication, role-based access control, and request validation.Phase 4 — Frontend Foundation: React application setup, JWT authentication integration, protected routes, role-based navigation, dashboard layout, and session persistence.Phase 5 — Rental Workflow: Complete rental request workflow, including creation, user listing, admin management, approval/rejection system, and dashboard synchronization.⚙️ Current System CapabilitiesUser authentication & JWT session persistenceRole-based dashboards & protected routesLayered backend architectureVehicle rental requests & administrative approval workflows🔮 Upcoming DevelopmentPhase 6 — Reservation RulesNext improvements will include vehicle availability validation, date conflict detection, reservation lifecycle management, and fleet scheduling rules.Future phases may include analytics dashboards, reporting tools, operational metrics, and an advanced scheduling engine.💻 Technology StackEnvironmentTechnologiesBackendNode.js, Express, MongoDB, Mongoose, JSON Web TokensFrontendReact, React Router, Axios, Context API🧠 Learning FocusThis project intentionally prioritizes architecture and engineering practices over rapid feature delivery. Key learning areas include layered backend design, separation of concerns, authentication systems, API design, full-stack integration, and scalable project structure.👨‍💻 AuthorEduardo HenriqueFull-stack developer focused on backend architecture, system design, and scalable APIs.
