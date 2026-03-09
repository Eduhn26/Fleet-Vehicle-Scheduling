# 📘 Engineering Journal — Phase 1: Backend Persistence Layer (Mongoose Models)

## 🎯 Phase Objective

The goal of this phase was to establish the persistence foundation of the backend, ensuring:

- Core domain entities are represented through structured database models
- MongoDB Atlas connectivity is working in a real environment
- Relationships between entities are correctly modeled through references
- The project is prepared for the Service layer without modifying persistence logic later

This phase establishes the data foundation of the backend and prepares the system for implementing business rules in the next architectural layer.

---

## 🧱 Core Components Implemented

### Vehicle Model

Business rules implemented:

- Formalized the vehicle data structure using a Mongoose schema
- Introduced controlled enums for vehicle state (e.g., available, rented, maintenance)
- Enforced structural constraints such as required fields and unique identifiers

Real risks prevented:

- Invalid vehicle documents entering the database
- Duplicate license plates corrupting fleet records
- Uncontrolled vehicle status values breaking future logic

---

### User Model

Business rules implemented:

- Defined the persistence structure for authentication and authorization data
- Enforced unique email constraint to prevent duplicate users
- Restricted role values through enum definitions

Real risks prevented:

- Multiple accounts registered with the same email
- Invalid role assignments compromising authorization
- Authentication logic being built on unstable user data

---

### RentalRequest Model

Business rules implemented:

- Implemented relational references between requests, users, and vehicles
- Defined a lifecycle state for rental requests (pending, approved, rejected)
- Introduced schema constraints to support future conflict detection

Real risks prevented:

- Data duplication caused by embedding entire user or vehicle objects
- Loss of control over request state transitions
- Future inconsistencies when validating rental conflicts

---

## 🛡️ Structural or Architectural Additions

Introduced new mechanisms:

- MongoDB Atlas connection through a centralized `database.js` configuration
- Environment variable management through `.env.example`
- Schema-level validation via Mongoose (`required`, `unique`, `enum`)

Architectural decision:

> Persistence models are responsible only for data structure and database constraints. Business rules remain exclusively in the Service layer.

This decision protects architectural boundaries by preventing business logic from leaking into the persistence layer. It ensures models remain stable while services evolve independently in future phases.

---

## 🧪 Validation or Testing Strategy

Created:

- `seed-user.js`
- `seed-vehicle.js`
- `seed-rental.js`

Purpose:

- Validate that each model can be successfully persisted in MongoDB Atlas
- Confirm relational integrity between User, Vehicle, and RentalRequest
- Detect schema, enum, and unique constraint errors early

Engineering improvement:

Instead of trusting schema definitions theoretically, seed scripts were used as persistence smoke tests. This approach validates the entire database layer against a real environment, ensuring that schemas, references, and constraints behave correctly before introducing business logic in the Service layer.

---

## ⚖️ Trade-offs and Explicit Decisions

- MongoDB Atlas was integrated early to validate persistence in a real database environment
- ObjectId references were chosen over embedded documents to preserve a single source of truth
- Password hashing was intentionally deferred to the Auth Service layer to keep models focused on structure
- Seed scripts were introduced early as lightweight persistence tests instead of relying solely on manual inspection

These decisions are conscious and documented.

---

## 📊 Architectural State After Phase 1

Layer isolation achieved:

Database Infrastructure → Mongoose Models → Future Service Layer

Key guarantee:

- Models define structure, not business decisions
- Persistence is isolated from HTTP and routing logic
- Future services can implement business rules without altering database schemas

This ensures the backend is functionally and architecturally complete, enabling the next phase without refactoring core logic.

---

## 🧠 Technical Learnings

- Difference between schema validation and business validation
- Proper use of ObjectId references for relational modeling in MongoDB
- Importance of separating persistence structure from business logic
- Benefits of validating persistence early using seed scripts

---

## ✅ Phase Completion Checklist

- [x] Core component implemented
- [x] Validation implemented
- [x] Errors standardized
- [x] Boundaries respected
- [x] Semantic commits created
- [x] Documentation updated

Phase 1 is considered complete.

The system is now ready for Phase 2 (Backend Services — Business Rules Layer).