Fleet Vehicle Scheduling

Backend-first fleet rental and vehicle scheduling system built with Node.js, Express and MongoDB.

Overview

This project is structured in progressive architectural phases.

The current state isolates business rules inside a dedicated Service layer, fully decoupled from HTTP transport.

Architecture

Layer separation:

Routes → Controllers → Services → Models

Current Phase: Phase 2 — Services Layer Complete

Business rules centralized

No HTTP logic inside Services

Error standardization via AppError

Repeatable smoke tests for validation
