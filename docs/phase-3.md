# 📘 Engineering Journal — Phase 3: Controllers, Routes & Middleware

## 🎯 Phase Objective

Implement HTTP layer, validation middleware, global error handler, and JWT authentication while preserving architectural boundaries, ensuring:

- Clear separation between transport logic and business rules
- Structural validation happening strictly before Controllers
- Role-based authorization enforced via middleware
- Foundation ready for frontend integration (Phase 4)

This phase establishes the transport layer and validation boundary for the application.

---

## 🧱 Core Components Implemented

### Controllers & Routes

Business rules implemented:

- Map incoming HTTP requests directly to pure Service layer methods
- Extract token data to identify the authenticated user's ID and role
- Return standard HTTP status codes (e.g., 201 for creation, 200 for success)
- Protect admin-specific routes explicitly per route using middleware

Real risks prevented:

- Unauthorized access to administrative endpoints
- Business logic leaking into the transport layer
- Direct database calls occurring inside the routing layer

---

### Middleware Layer (auth, validate, requireRole, errorHandler)

Business rules implemented:

- Stateless JWT authentication and token extraction from headers
- Role-based authorization validated before controller execution
- Structural payload validation using Zod schemas before hitting controllers
- Standardized JSON parse error handling returning HTTP 400

Real risks prevented:

- Malformed JSON bodies crashing the server
- Invalid payload shapes bypassing validation and reaching the business logic
- Inconsistent error responses leaking system details or stack traces to the client

---

## 🛡️ Structural or Architectural Additions

Introduced new middleware mechanisms:

- Global Error Handler (`errorHandler.js`) to unify operational and system errors
- Validation Middleware (`validate.js`) using flattened Zod issues
- Role-Based Authorization Middleware (`requireRole.js`)

Architectural decision:

> Controllers must not contain business logic, and Services must not import Express objects.

This enforces a strict Validation Boundary and isolates the Transport Layer from the domain logic.

---

## 🧪 Validation or Testing Strategy

Created:

- `reset-admin-password.js` script
- Manual PowerShell HTTP call suite

Purpose:

- Validate correct HTTP status codes (401, 403, 201, 400, 422, 409)
- Detect regressions in status transitions (e.g., blocking repeated rental approvals)
- Provide a development-safe mechanism to reset admin credentials

Engineering improvement:

Behavioral validations ensure the HTTP layer correctly translates Service exceptions (Operational Errors) into standard HTTP status codes without exposing System Errors. Testing identified a flaw where approving an already approved rental returned 200, which was immediately resolved with an explicit status transition guard.

---

## ⚖️ Trade-offs and Explicit Decisions

- JWT was chosen as the stateless authentication strategy (no session state stored)
- Admin protection is enforced explicitly per route rather than globally to maintain granular control
- Invalid JSON body parsing errors are explicitly intercepted to return 400 instead of 500
- Added explicit status transition guards in rentalService based on HTTP testing feedback

These decisions are conscious and documented.

---

## 📊 Architectural State After Phase 3

Layer isolation achieved:

Models → Services → Controllers → Routes → Middleware

Key guarantee:

- No HTTP objects inside Services
- No business logic inside Controllers
- No direct DB calls in Routes

This ensures the backend is functionally and architecturally complete, enabling the next phase without refactoring core logic.

---

## 🧠 Technical Learnings

- PowerShell multi-line commands using `\` cause fatal repository errors; backtick syntax or single-line commands are required
- Malformed JSON initially caused inconsistent error handling, requiring a specific check (`isLikelyJsonSyntaxError`)
- Approving an already approved rental initially returned 200, highlighting the need for strict state transition guards
- Markdown formatting can differ between chat-rendered views and raw text, requiring a `_phase-template.md`
- Accidentally staging snapshot files requires strict `.gitignore` management

---

## ✅ Phase Completion Checklist

- [x] Core component implemented
- [x] Validation implemented
- [x] Errors standardized
- [x] Boundaries respected
- [x] Semantic commits created
- [x] Documentation updated

Phase 3 is considered complete.

The system is now ready for Phase 4 (Frontend Application / React Integration).