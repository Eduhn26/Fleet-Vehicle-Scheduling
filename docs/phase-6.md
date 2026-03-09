# 📘 Engineering Journal — Phase 6: Reservation Rules

## 🎯 Phase Objective

Implement the full reservation lifecycle for vehicle scheduling.

Goals achieved:

- Allow users to create reservation requests
- Allow administrators to approve or reject requests
- Prevent conflicting reservations
- Enforce reservation duration limits
- Allow users to cancel reservations safely

This phase establishes the **core scheduling engine of the system**.

---

## 🧱 Core Components Implemented

### RentalService

Business rules implemented:

- Reservation period validation
- Maximum reservation duration (5 days)
- Prevention of overlapping reservations
- Reservation lifecycle management
- Safe cancellation rules

Real risks prevented:

- Double booking of vehicles
- Invalid date ranges
- Canceling already finalized reservations

---

### RentalValidator

Business rules implemented:

- Date validation
- Payload structure validation
- Required field validation

Real risks prevented:

- Invalid request payloads
- Incorrect date formats
- Missing business data

---

## 🛡️ Structural or Architectural Additions

Introduced mechanisms:

- Reservation lifecycle state machine
- Conflict detection algorithm
- Canonical date normalization

Architectural decision:

> All reservation conflict rules live inside the service layer, ensuring that controllers remain thin and business logic stays centralized.

This reinforces the **layered architecture** of the project.

---

## ⚠️ Key Engineering Challenges

### Timezone Handling

Problem:

Date validation incorrectly flagged today's date as past due to UTC conversion.

Solution:

Separate validation logic from persistence normalization.

Outcome:

Reliable comparison between user input and system rules.

---

## 🔄 Reservation Lifecycle

The system now supports the following states:


pending → approved
pending → rejected
approved → cancelled


Invalid transitions are blocked by the service layer.

---

## 🧪 Validation Strategy

Conflict detection prevents overlapping reservations:


newStart <= existingEnd
AND
newEnd >= existingStart


This ensures safe scheduling without double booking.

---

## 🧭 Impact on Future Phases

This phase establishes the **foundation for scheduling features**, including:

- hourly reservations (future)
- calendar visualization
- fleet utilization metrics

The current implementation focuses on **day-based scheduling**, ensuring simplicity and reliability.

---

## ✅ Phase Outcome

The reservation engine is now:

- consistent
- deterministic
- protected against conflicts
- aligned with layered architecture principles

This completes the scheduling core of the system.