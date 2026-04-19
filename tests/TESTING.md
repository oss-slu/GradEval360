# Testing Strategy

This repository uses a layered test structure so we can scale coverage without mixing responsibilities.

## Layout

- `client/tests/unit/`: fast logic-level tests for frontend helpers and view-model code
- `server/tests/unit/`: isolated backend logic tests that do not require a running server or database
- `shared/tests/unit/`: shared schema and contract tests
- `client/tests/integration/`: reserved for future component and multi-module UI flows
- `server/tests/integration/`: reserved for future route, database, and API workflow tests
- `tests/e2e/`: reserved for future full-system journeys across client, server, auth, and database
- `tests/fixtures/`: reusable factories and sample objects shared across test suites

## Naming

- Keep unit tests as `*.test.ts`
- Match the test file name to the behavior under test when possible
- Prefer colocated production logic in `src/` and place tests under the package's `tests/` folder

## Coverage Policy

Coverage is enforced in CI through workspace-specific thresholds:

- `client`: lines `>= 80`, branches `>= 70`, functions `>= 80`
- `server`: lines `>= 80`, branches `>= 80`, functions `>= 80`
- `shared`: lines `>= 80`, branches `>= 80`, functions `>= 50`

Thresholds should rise only when they reflect stable, meaningful checks.

## Commands

- `npm test`: run all workspace unit tests
- `npm run test:coverage`: run all workspace tests with enforced coverage thresholds
- `npm --prefix server run test:integration`: run server smoke/integration coverage that requires the app to be up
