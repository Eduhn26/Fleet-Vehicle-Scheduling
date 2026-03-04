# Fleet Vehicle Scheduling

Backend-first **fleet rental and vehicle scheduling system** built with **Node.js, Express, MongoDB and React**.

The project focuses on **architecture, separation of concerns and progressive system design**, simulating how a real production system evolves over time.

---

# Project Purpose

This project was created as a **full-stack architecture learning exercise**, focused on developing production-style systems.

The goals of the project are:

* Practice **layered backend architecture**
* Separate **transport, business rules and persistence**
* Implement **authentication flows used in real SaaS systems**
* Build a **scalable codebase that grows in phases**
* Demonstrate **clean architecture thinking for interviews**

Rather than building everything at once, the system evolves through **incremental phases**.

---

# System Overview

Fleet Vehicle Scheduling is designed to manage:

* vehicle fleets
* rental operations
* scheduling of vehicles
* role-based user access

The system follows a **backend-first approach**, where the API and business logic are implemented before the UI.

---

# Architecture

The backend follows a **layered architecture** designed to isolate responsibilities.

```id="arch1"
Routes → Controllers → Services → Models
```

## Layer Responsibilities

### Routes

Responsible for defining **API endpoints**.

Example:

```id="arch2"
POST /api/auth/login
GET  /api/vehicles
POST /api/rentals
```

Routes map HTTP requests to controllers.

---

### Controllers

Controllers handle **HTTP concerns**:

* request parsing
* validation
* response formatting
* calling services

Controllers should **not contain business rules**.

---

### Services

Services contain the **application business logic**.

Examples:

```id="arch3"
createRental()
validateVehicleAvailability()
registerVehicle()
authenticateUser()
```

Rules implemented in Services:

* no HTTP logic
* reusable business logic
* centralized validation
* standardized error throwing

---

### Models

Models define **database schemas** using Mongoose.

Example responsibilities:

* schema definition
* persistence layer
* database interaction

---

# Backend Architecture Principles

The backend enforces several design rules:

### Service Isolation

Business rules must live inside **Services**, not controllers.

### Controller Thinness

Controllers should remain thin and only coordinate requests.

### Standardized Errors

Custom error handling via `AppError`.

### Predictable Flow

```id="arch4"
HTTP Request
     ↓
Route
     ↓
Controller
     ↓
Service
     ↓
Database Model
```

This structure ensures **clear separation between transport and domain logic**.

---

# Frontend Architecture

The frontend is implemented using **React** and follows a modular structure.

Main responsibilities:

* authentication
* protected navigation
* dashboard rendering
* API consumption

Frontend structure:

```id="front1"
Pages
Components
Context
Services
Styles
```

---

# Authentication System

Authentication is implemented using **JWT tokens**.

## Login Flow

```id="auth1"
Frontend → POST /api/auth/login
         ↓
Backend validates credentials
         ↓
JWT token generated
         ↓
Token returned to frontend
         ↓
Stored in localStorage
```

Stored session data:

```id="auth2"
localStorage.token
localStorage.user
```

---

# Session Persistence

Authentication state is maintained using **React Context**.

Component:

```id="auth3"
AuthContext
```

Responsibilities:

* login()
* logout()
* session persistence
* global auth state

---

# Axios Interceptor

API requests are handled by a centralized Axios instance.

Features:

* automatic JWT injection
* centralized API configuration
* automatic logout on token failure

Example behavior:

```id="auth4"
request → attach Authorization header
response 401 → trigger logout
```

---

# Protected Routes

Frontend routes are protected through a dedicated component:

```id="auth5"
PrivateRoute
```

Behavior:

```id="auth6"
not authenticated → redirect /login
authenticated → allow access
```

---

# Role-Based Navigation

Users are redirected depending on their role.

```id="auth7"
admin → /admin
user  → /user
```

This allows separation between administrative and normal user dashboards.

---

# Layout System

A reusable layout component provides shared UI elements:

```id="layout1"
Layout
```

Features:

* navigation bar
* logout button
* shared dashboard layout

Pages render inside the layout.

---

# Project Structure

## Backend

```id="tree1"
backend
│
├─ controllers
│
├─ middleware
│
├─ models
│
├─ routes
│
├─ services
│
├─ validators
│
└─ scripts
   ├─ list-users.js
   └─ reset-password.js
```

---

## Frontend

```id="tree2"
frontend/src
│
├─ components
│  ├─ Layout.js
│  └─ PrivateRoute.js
│
├─ context
│  └─ AuthContext.js
│
├─ pages
│  ├─ login.js
│  ├─ adminDashboard.js
│  └─ userDashboard.js
│
├─ services
│  └─ api.js
│
├─ styles
│  ├─ global.css
│  ├─ layout.css
│  └─ login.css
│
├─ App.js
└─ index.js
```

---

# Development Utilities

Two helper scripts were created for development debugging.

### List users

```id="script1"
node backend/scripts/list-users.js
```

Displays all registered users in the database.

---

### Reset password

```id="script2"
node backend/scripts/reset-password.js
```

Allows manual password reset for development accounts.

---

# Development Phases

The project evolves through **incremental architectural phases**.

---

## Phase 1 — Foundation

System initialization.

Features:

* Express server
* MongoDB connection
* project structure
* environment configuration

---

## Phase 2 — Services Layer

Business logic centralization.

Features:

* Services layer introduced
* Controllers simplified
* AppError error system

---

## Phase 3 — Routes & Controllers

Backend API completion.

Features:

* REST routes implemented
* controllers handling HTTP flow
* API endpoints for frontend integration

---

## Phase 4 — Frontend Foundation

Full authentication frontend implemented.

Features:

* React application setup
* JWT login flow
* protected routes
* role-based navigation
* dashboard layout
* session persistence

Current state: **Phase 4 completed**

---

# Technology Stack

## Backend

* Node.js
* Express
* MongoDB
* Mongoose
* JSON Web Tokens

---

## Frontend

* React
* React Router
* Axios
* Context API

---

# Current System Capabilities

The system currently supports:

* user authentication
* JWT session persistence
* role-based dashboards
* protected routes
* structured backend API
* layered backend architecture

---

# Upcoming Development

## Phase 5 — Vehicle Management

Next features:

* vehicle CRUD
* fleet management dashboard
* vehicle availability tracking
* scheduling interface

Future phases will include:

* rental workflows
* scheduling validation
* reporting dashboards

---

# Learning Focus

This project intentionally focuses on **architecture over speed**.

Key learning areas:

* layered backend design
* separation of concerns
* authentication flows
* full-stack integration
* scalable project structure

---

# Author

Eduardo Henrique

Full-stack developer focused on **backend architecture, system design and scalable APIs**.
