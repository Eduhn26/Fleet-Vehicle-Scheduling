# 📘 Engineering Journal — Phase 10: Engineering Hardening

## 🎯 Phase Objective

This phase focused on transforming the backend from a functional production system into a more reliable and evolvable engineering asset.

Main objectives:

- Introduce automated test coverage for critical business rules
- Protect the reservation lifecycle against regression
- Validate HTTP contracts, authorization, and payload validation
- Add continuous integration to automate quality checks

This phase establishes a stronger engineering foundation for future evolution, reducing the risk of breaking core backend behavior during refactors and new feature work.

---

## 🧱 Core Components Implemented

### Automated Service Test Suite

Business rules implemented and validated:

- rental creation for valid future periods
- rejection of reservation periods longer than 5 days
- approval of pending requests
- conflict protection for overlapping approved reservations
- cancellation flow and duplicate cancellation blocking
- lifecycle protection against invalid approval after cancellation
- return request flow with mileage validation
- rental completion flow with mileage history persistence
- automatic maintenance transition when mileage reaches threshold

Real risks prevented:

- regressions in reservation lifecycle transitions
- silent breakage in critical business rules during refactors
- invalid mileage updates corrupting fleet state
- missing maintenance transitions after return completion

---

### HTTP Contract Test Suite

Business rules and transport behavior validated:

- protected rental creation requires authentication
- invalid request payload returns validation errors
- admin-only approval route enforces authorization
- owner cancellation flow works through real HTTP endpoints
- controller → middleware → service integration behaves as expected

Real risks prevented:

- broken route contracts after backend changes
- auth middleware regressions
- role-based access failures
- validation behavior diverging from expected API responses

---

## 🛡️ Structural or Architectural Additions

Introduced new mechanisms:

- Jest-based backend test runner
- MongoMemoryServer for isolated database-backed tests
- Supertest for HTTP integration testing
- GitHub Actions pipeline for backend lint and test execution
- ESLint compatibility adjustments for the existing `.eslintrc.json` setup
- Jest-aware ESLint overrides for test files

Architectural decision:

> Business rules were validated first at the service layer, then validated again at the HTTP layer.

This preserved the project’s layered architecture and followed the correct confidence-building order:
first protect the domain logic, then protect the transport contract.

---

## 🧪 Validation Performed

### Local Validation

Validated successfully:

- `npm run lint`
- `npm test`

Results:

- lint clean
- 18 tests passing
- service and HTTP suites green

### CI Validation

Validated successfully:

- GitHub Actions workflow triggered on push
- dependency installation
- lint execution
- automated test execution

Pipeline result:

- Backend CI passing

---

## ⚠️ Hurdles & Fixes

### ESLint Version Compatibility

Issue:

The CI initially failed because ESLint v10 expected the new `eslint.config.js` flat config format, while the project still used `.eslintrc.json`.

Fix:

- pinned ESLint to a v8-compatible version
- preserved current project structure
- avoided unnecessary config migration during Phase 10

Why it mattered:

This kept the phase focused on hardening, instead of expanding scope into tooling migration.

---

### Jest Globals Not Recognized by ESLint

Issue:

Lint treated `describe`, `it`, `expect`, `beforeAll`, and related globals as undefined inside test files.

Fix:

- added ESLint override for `tests/**/*.js`
- enabled Jest environment only for test files

Why it mattered:

This aligned lint behavior with the actual execution environment of the backend test suite.

---

### Unused Arguments in `cancelRequest`

Issue:

The service signature contained unused parameters, causing lint warnings.

Fix:

- removed unused arguments from the service signature
- kept the implementation aligned with actual behavior

Why it mattered:

This allowed the lint step to become fully clean and kept the CI pipeline stable.

---

## 📂 Main Files Added or Updated

### New files

- `backend/jest.config.js`
- `backend/tests/helpers/appErrorAssert.js`
- `backend/tests/services/rentalService.test.js`
- `backend/tests/http/rentalRoutes.test.js`
- `.github/workflows/backend-ci.yml`
- `docs/phase-10.md`

### Updated files

- `backend/package.json`
- `backend/package-lock.json`
- `backend/.eslintrc.json`
- `backend/src/services/rentalService.js`

---

## 📈 Engineering Evolution

Before this phase, the project already had:

- layered backend architecture
- production deployment
- functional reservation lifecycle
- administrative workflow
- fleet return and mileage flow

After this phase, the project now also has:

- automated business rule protection
- automated HTTP contract validation
- repeatable local verification
- CI-based backend quality checks
- lower risk for future refactors

This phase marks the transition from a working backend to a backend with engineering safeguards.

---

## 🔭 Impact on Next Phases

Phase 10 created the technical safety net required for the next stage of evolution.

What becomes easier now:

- refactoring lifecycle logic with lower regression risk
- improving data consistency in critical flows
- introducing observability without breaking existing routes
- expanding the API with more confidence

Recommended next phase:

> **Phase 11 — Observability & Operational Intelligence**

Natural next priorities:

- structured logging
- richer health checks
- operational metrics
- backend visibility in production

---

## ✅ Final Outcome

Phase 10 successfully hardened the backend with:

- clean lint
- 18 passing automated tests
- service-level coverage
- HTTP-level coverage
- GitHub Actions CI passing

The backend is now significantly more reliable as a production-oriented portfolio project and a safer base for future engineering work.