# 📘 Engineering Journal — Phase 2: Backend Services

## 🎯 Phase Objective

Isolate business rules into pure Service layer modules, ensuring:

- Clear separation between business logic and HTTP layer
- Consistent validation rules
- Standardized semantic errors
- Foundation ready for Controllers + Middleware (Phase 3)

This phase establishes the core decision logic of the system.

---

## 🧱 Services Implemented

### vehicleService

Business rules implemented:

- License plate normalization (uppercase)
- Prevent negative mileage
- Mileage cannot decrease
- Automatic transition to `maintenance` when threshold is reached
- Manual override allowed via explicit rule
- `recordMaintenance` resets threshold and updates status

Real risks prevented:

- Vehicles being rented with expired maintenance
- Mileage corruption
- Silent state inconsistencies

---

### rentalService

Business rules implemented:

- Maximum rental period: 5 days
- `startDate` cannot be in the past
- `endDate` must be >= `startDate`
- Date conflict detection (approved reservations block)
- Duplicate request prevention (pending + approved)
- Vehicles in `maintenance` cannot be rented
- Consistent approve/reject flow

Real risks prevented:

- Overbooking
- Conflicting reservations
- Duplicate rental spam
- Renting unavailable vehicles

---

## 🛡️ Error Standardization

Introduced `AppError`:

- Explicit `statusCode`
- `isOperational` flag
- Prepared for global error handler in Phase 3

Architectural decision:

> Semantic errors originate in the Service layer, not in Controllers.

This keeps business logic independent from transport concerns.

---

## 🧪 Smoke Tests

Created:

- `smoke-vehicle.js`
- `smoke-rental.js` (idempotent)

Purpose:

- Validate business rules without HTTP layer
- Enable repeatable local verification
- Detect regressions early

Engineering improvement:

Smoke tests are idempotent — they can run multiple times without breaking due to existing data.

---

## ⚖️ Trade-offs and Explicit Decisions

- No MongoDB transactions (out of MVP scope)
- Role validation will be enforced in middleware (Phase 3)
- Reservation cancellation not implemented (intentional scope control)
- No concurrency locking (acceptable for current project scale)

These decisions are conscious and documented.

---

## 📊 Architectural State After Phase 2

Layer isolation achieved:

Models → Services → (Phase 3: Controllers)

Key guarantee:

- No HTTP objects (`req`, `res`) inside Services
- No business logic inside Models
- No transport concerns leaking into business rules

This ensures Phase 3 can be implemented without refactoring core logic.

---

## 🧠 Technical Learnings

- Folder structure impacts runtime behavior (module resolution matters)
- Operational errors must be distinguishable from system errors
- Idempotent smoke tests increase engineering reliability
- Business rules must be centralized to avoid duplication
- Index duplication in Mongoose can cause warnings and should be handled intentionally

---

## ✅ Phase Completion Checklist

- [x] vehicleService implemented
- [x] rentalService implemented
- [x] AppError standardized
- [x] Business rules validated
- [x] Idempotent smoke tests
- [x] Semantic commits
- [x] Architectural boundaries respected

Phase 2 is considered complete.

The system is now ready for Phase 3 (Controllers, Routes, Global Error Handler).