
# Fleet Vehicle Scheduling

Full-stack fleet rental and vehicle scheduling system built with Node.js, Express, MongoDB and React.

The project focuses on software architecture, separation of concerns and progressive system evolution, simulating how a real production system grows over time.

Instead of implementing everything at once, the system is built through incremental engineering phases, each introducing new architectural capabilities.

Project Goals

This project was created as a full-stack architecture learning exercise, with a strong emphasis on backend system design.

The goals of the project are:

Practice layered backend architecture

Implement separation between transport, business rules and persistence

Build authentication flows used in real SaaS systems

Design a scalable codebase that evolves in phases

Demonstrate clean architecture thinking in interviews

The focus is engineering quality over feature speed.

System Overview

Fleet Vehicle Scheduling is designed to manage:

vehicle fleets

vehicle rental requests

scheduling of fleet resources

administrative approval workflows

role-based user access

The project follows a backend-first development strategy, where the API and business logic are implemented before the UI layer.

Architecture

The backend follows a layered architecture designed to isolate responsibilities.

Routes → Controllers → Services → Models

Each layer has a strict responsibility boundary.

Layer Responsibilities
Routes

Responsible for defining API endpoints.

Example endpoints:

POST /api/auth/login
GET  /api/vehicles
POST /api/rentals

Routes map incoming HTTP requests to controllers.

Controllers

Controllers handle HTTP concerns only:

request parsing

validation

response formatting

calling services

Controllers must not contain business rules.

Services

Services contain the application business logic.

Examples:

createRental()
validateVehicleAvailability()
registerVehicle()
authenticateUser()

Rules enforced inside services:

no HTTP dependencies

reusable business logic

centralized rule validation

standardized error handling

Models

Models define database schemas using Mongoose.

Responsibilities:

schema definition

persistence logic

database interaction

Backend Architecture Principles

The backend enforces several design guarantees.

Service Isolation

Business rules live exclusively inside Services, not Controllers.

Thin Controllers

Controllers act as coordinators between HTTP and the Service layer.

Standardized Errors

Errors are handled through a centralized AppError system, ensuring consistent responses.

Predictable Request Flow
HTTP Request
     ↓
Route
     ↓
Controller
     ↓
Service
     ↓
Database Model

This ensures clear separation between transport and business logic.

Frontend Architecture

The frontend is implemented using React.

Its responsibilities include:

authentication

protected navigation

dashboard rendering

API consumption

workflow interaction

Frontend structure:

Pages
Components
Context
Services
Styles
Authentication System

Authentication is implemented using JWT tokens.

Login Flow
Frontend → POST /api/auth/login
         ↓
Backend validates credentials
         ↓
JWT token generated
         ↓
Token returned to frontend
         ↓
Stored in localStorage

Stored session data:

localStorage.token
localStorage.user
Session Persistence

Authentication state is maintained using React Context.

Component:

AuthContext

Responsibilities:

login()

logout()

session persistence

global authentication state

Axios Interceptor

All API requests are made through a centralized Axios instance.

Features:

automatic JWT injection

centralized API configuration

automatic logout on token failure

Behavior example:

request → attach Authorization header
response 401 → trigger logout
Protected Routes

Frontend routes are protected through a dedicated component:

PrivateRoute

Behavior:

not authenticated → redirect /login
authenticated → allow access
Role-Based Navigation

Users are redirected depending on their role.

admin → /admin
user  → /user

This separates administrative features from normal user workflows.

Layout System

A reusable layout component provides shared UI elements.

Component:

Layout

Features:

navigation bar

logout button

shared dashboard structure

All pages render inside this layout.

Project Structure
Backend
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
Frontend
frontend/src
│
├─ components
│  ├─ Layout.js
│  ├─ PrivateRoute.js
│  ├─ AdminRentalTable.js
│  └─ RentalForm.js
│
├─ context
│  └─ AuthContext.js
│
├─ pages
│  ├─ login.js
│  ├─ adminDashboard.js
│  ├─ userDashboard.js
│  └─ rentals.js
│
├─ services
│  └─ api.js
│
├─ styles
│  ├─ global.css
│  ├─ layout.css
│  ├─ login.css
│  └─ dashboard.css
│
├─ App.js
└─ index.js
Development Utilities

Two helper scripts were created for development debugging.

List users
node backend/scripts/list-users.js

Displays all registered users in the database.

Reset password
node backend/scripts/reset-password.js

Allows manual password reset for development accounts.

Engineering Phases

The system evolves through incremental architectural phases.

Phase 1 — Foundation

System initialization.

Features:

Express server setup

MongoDB connection

project structure

environment configuration

Phase 2 — Services Layer

Business logic centralization.

Features:

Services layer introduced

Controllers simplified

AppError error system

Phase 3 — HTTP Layer & Security

Backend API completion.

Features:

REST routes implemented

controllers handling HTTP flow

JWT authentication

role-based access control

request validation

Phase 4 — Frontend Foundation

Frontend infrastructure.

Features:

React application setup

JWT authentication integration

protected routes

role-based navigation

dashboard layout

session persistence

Phase 5 — Rental Workflow

Complete rental request workflow.

Features:

rental request creation

user request listing

admin request management

approval and rejection system

dashboard synchronization

Current System Capabilities

The system currently supports:

user authentication

JWT session persistence

role-based dashboards

protected routes

vehicle rental requests

administrative approval workflows

layered backend architecture

Upcoming Development
Phase 6 — Reservation Rules

Next improvements will include:

vehicle availability validation

date conflict detection

reservation lifecycle management

fleet scheduling rules

Future phases may include:

analytics dashboards

reporting tools

operational metrics

advanced scheduling engine

Technology Stack
Backend

Node.js

Express

MongoDB

Mongoose

JSON Web Tokens

Frontend

React

React Router

Axios

Context API

Learning Focus

This project intentionally prioritizes architecture and engineering practices over rapid feature delivery.

Key learning areas:

layered backend design

separation of concerns

authentication systems

API design

full-stack integration

scalable project structure

Author

Eduardo Henrique

Full-stack developer focused on backend architecture, system design and scalable APIs.
