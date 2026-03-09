# 📘 Engineering Journal — Phase 5: Frontend Application & Rental Workflow

## 🎯 Phase Objective

This phase introduces the React frontend application layer and connects it to the REST API implemented in previous phases.

The primary goals were:

- Implement a React client capable of authenticating users via JWT
- Establish a consistent API communication layer using Axios
- Build role-based dashboards for users and administrators
- Complete the vehicle rental request workflow

This phase establishes the first complete end-to-end product workflow, enabling real interaction between users and administrators through the system interface.

---

## 🧱 Core Components Implemented

### Authentication Context (AuthContext)

Business rules implemented:

- Persist authenticated user sessions using JWT stored in localStorage
- Expose authentication state globally through React Context
- Automatically restore sessions on page reload

Real risks prevented:
- Losing authentication state on page refresh
- Components manually managing authentication logic
- Inconsistent session behavior across the application

---

### Rental Request Workflow

Business rules implemented:
- Users can create rental requests via RentalForm
- Users can view their own requests via GET /api/rentals/my
- Administrators can approve or reject requests via the admin dashboard

Real risks prevented:
- Users viewing requests belonging to other users
- Multiple UI components directly calling APIs inconsistently
- State desynchronization between dashboard metrics and request lists

---

## 🛡️ Structural or Architectural Additions

Introduced new mechanisms:

- Centralized Axios API client with JWT interceptor
- PrivateRoute component enforcing protected routes
- Role-based routing directing users to correct dashboards

Architectural decision:

> The frontend communicates exclusively through a centralized API client (services/api.js).

[Short explanation reinforcing boundary discipline or why this decision matters.]

---

## 🧪 Validation or Testing Strategy

Created:

- Manual UI validation through browser testing
- API inspection via network tools and direct endpoint testing

Purpose:
- Verify authentication persistence across reloads
- Validate role-based routing behavior
- Ensure rental workflow functions end-to-end

Engineering improvement:

This phase significantly improved system validation by enabling real user interaction with the API. Instead of relying solely on isolated backend tests, the system is now validated through full client-server integration, revealing synchronization issues early and ensuring API contracts behave correctly under real usage scenarios.

---

## ⚖️ Trade-offs and Explicit Decisions

- React Context was chosen for authentication state instead of external state managers to keep the architecture lightweight.
- Axios interceptors were used to inject JWT tokens automatically instead of repeating authorization logic in each request.
- Role-based routing was implemented at the routing layer rather than at individual components to centralize access control.
- Inline CSS was intentionally avoided in favor of structured feature-based CSS files to maintain styling discipline.

These decisions are conscious and documented.

---

## 📊 Architectural State After Phase 5

Layer isolation achieved:

[React UI] → [API Client (Axios)] → [Express Controllers] → [Services] → [Models]

Key guarantee:
- Frontend never communicates directly with the database
- Authentication state is managed centrally through AuthContext
- API contracts remain the single source of truth between frontend and backend

This ensures the backend is functionally and architecturally complete, enabling the next phase without refactoring core logic.

---

## 🧠 Technical Learnings

- Proper separation between authentication state management and UI components prevents duplicated logic.
- Centralizing API communication simplifies error handling and token management.
- Role-based routing is easier to maintain when enforced at the routing layer instead of individual components.
- End-to-end workflows expose integration bugs earlier than isolated backend tests.

---

## ✅ Phase Completion Checklist

- [x] Core component implemented
- [x] Validation implemented
- [x] Errors standardized
- [x] Boundaries respected
- [x] Semantic commits created
- [x] Documentation updated

Phase 5 is considered complete.

The system is now ready for Phase 6 (Reservation Rules & Scheduling Logic).