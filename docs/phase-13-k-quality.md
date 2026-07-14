# Phase 13.K — Analytics Quality Hardening

## Objective

Strengthen the Fleet Intelligence layer before final documentation and pull request review.

This phase does not introduce a new business feature. It protects the analytical architecture already created across Node.js, FastAPI, Pandas, React and Docker Compose.

## Test boundaries

### Node.js

The analytics test suite covers:

- JWT authentication;
- admin-only authorization;
- health endpoint;
- query filter forwarding;
- Node-to-Python client contract;
- safe fallback behavior;
- JSON export headers;
- CSV export headers;
- UTF-8 BOM for Excel;
- operational error propagation;
- analytical service orchestration.

Run:

```bash
cd backend
npm run test:analytics
npm run test:analytics:coverage
```

The targeted Jest configuration enforces an initial coverage baseline only for the analytics boundary. It does not distort coverage statistics with unrelated legacy modules.

### Python

The FastAPI/Pandas suite covers:

- health endpoints;
- normalized dataset contract;
- filtered overview metrics;
- temporal analysis;
- inclusive final-date filtering;
- mileage filtering;
- maintenance alert ordering;
- empty dataset stability;
- count mismatch warnings;
- every supported Power BI table;
- Excel pt-BR CSV formatting;
- sensitive-field exclusion;
- CSV escaping for semicolons, quotes and accents.

Run through Docker Compose:

```bash
docker compose run --rm analytics-service pytest
```

The Python suite enforces at least 80% coverage for the `app` package.

## Expected validation

```txt
Backend analytics:
3 suites
19 tests

Python analytics:
24 test items
coverage >= 80%
```

The full backend suite should also remain green:

```bash
cd backend
npm test
```

## Generated reports

These reports are local development artifacts and are ignored by Git:

```txt
backend/coverage/analytics/
analytics-service/coverage.xml
.coverage
```

## Success criteria

Phase 13.K is complete when:

- the complete backend test suite passes;
- the targeted analytics Jest suite passes;
- the targeted analytics coverage threshold passes;
- the Python suite passes inside Docker Compose;
- Python coverage remains at or above 80%;
- fallback, exports and filters remain operational in the browser;
- no coverage or cache artifact appears in `git status`.
