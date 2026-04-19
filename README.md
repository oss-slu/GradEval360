# GradEval360

<!-- README_METRICS_START -->
## Live Project Signals

[![CI](https://github.com/oss-slu/GradEval360/actions/workflows/ci.yml/badge.svg)](https://github.com/oss-slu/GradEval360/actions/workflows/ci.yml) ![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/oss-slu/GradEval360/main/.github/badges/coverage-summary.json)

This snapshot is auto-updated from GitHub Actions on pushes to `main`.

| Workspace | Line Coverage | Branch Coverage | Function Coverage |
| --- | ---: | ---: | ---: |
| Client | 94.68% | 72.92% | 100.00% |
| Server | 98.54% | 78.13% | 88.24% |
| Shared | 100.00% | 100.00% | 50.00% |

Last metrics refresh: 2026-04-19 04:54:43.859Z
<!-- README_METRICS_END -->

Welcome to the **GradEval360** development team! This project is the centralized performance management platform for Saint Louis University's Graduate Assistants.

## Project Focus: Spring 2026
Our current milestone work completes the full **Milestone 2 annual evaluation workflow**. That includes expectation setting, GA acknowledgment, GA self-evaluation, mentor evaluation, admin sign-off, status reporting, and dashboard visibility through `FinalEvaluated`.

---

## How to Get Started
We have a dedicated guide to help you set up your machine. **Please follow this first to ensure your environment is ready:**

- Environment/setup guide: [docs/setup.md](./docs/setup.md)
- Okta app setup + troubleshooting + smoke test: [docs/OKTA_SETUP_AND_SMOKE_TEST.md](./docs/OKTA_SETUP_AND_SMOKE_TEST.md)

---

## Prerequisites (Quick Check)
Make sure these are installed before you start:

- Node.js v20+ and npm v10+ (`node -v`, `npm -v`)
- Docker Desktop (`docker --version`)
- Git (`git --version`)

If anything is missing, follow the instructions in `docs/setup.md`.

---

## Project Structure
This is a **monorepo**, meaning all the code for the website, the server, and the database lives in this one folder. Here is a map of the project to help you find your way:

```text
GradEval360/
├── client/             # Frontend (React + Vite)
│   ├── src/components/ # Reusable UI pieces (Buttons, Inputs, Sidebar)
│   ├── src/pages/      # Full views (Login, Dashboard, Appointments)
│   ├── src/lib/        # Client config (Auth client, API fetchers)
│   └── src/hooks/      # Shared React hooks
├── server/             # Backend (Express.js)
│   ├── drizzle/        # Drizzle migrations output
│   ├── src/db/         # Database schema, migrations, and seed data
│   ├── src/routes/     # API endpoints (The URLs the frontend calls)
│   ├── src/middleware/ # Security checks (Checking if you are logged in)
│   └── src/scripts/    # One-off scripts (seeding, backfills, etc.)
├── shared/             # Shared Logic (The "Glue")
│   ├── schemas/        # Shared Zod schemas
│   └── src/            # Shared types/build outputs
├── docs/               # Team docs (setup, auth, references)
└── docker-compose.yml  # The "Command Center" to start your database
```

## Code Boundaries

- `client/src/` owns UI rendering, page state, and browser interactions.
- `server/src/routes/*.ts` owns HTTP orchestration, while `server/src/routes/*.logic.ts` owns pure workflow logic.
- `shared/schemas/` owns contracts shared by client and server.
- `client/tests/`, `server/tests/`, `shared/tests/`, and `tests/` own test code and fixtures only.

See [tests/TESTING.md](./tests/TESTING.md) for the repository testing strategy.

---

## Architecture Diagram
For a high-level system view, see:
- Diagram source: [docs/architecture.mmd](./docs/architecture.mmd)
- Rendered SVG: [docs/architecture.svg](./docs/architecture.svg)

---

## Quick Start (Local)
If you’ve already met the prerequisites, this is the shortest path to running the app locally:

```bash
# 1. Install workspace dependencies
npm ci

# 2. Build shared schemas/types
cd shared && npm run build
cd ..

# 3. Start database containers
docker-compose up -d

# 4. Initialize database (schema + seed)
cd server && npm run db:setup
cd ..

# 5. Run backend and frontend in separate terminals
cd server && npm run dev
cd client && npm run dev
```

---

## Environment Variables
Create `server/.env` and set the required values. You can copy the example below and fill in real values:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/gradeval360

# Okta OIDC
OKTA_ISSUER_URL=https://your-okta-domain.okta.com/oauth2/default
OKTA_CLIENT_ID=your_okta_client_id
OKTA_CLIENT_SECRET=your_okta_client_secret
OKTA_POST_LOGIN_REDIRECT_URL=http://localhost:5173

# Better Auth
BETTER_AUTH_SECRET=your_long_random_string
BETTER_AUTH_URL=http://localhost:3000
```

For more detail, see `docs/OKTA_SETUP_AND_SMOKE_TEST.md`.

---

## Common Commands
Run these from the repository root unless noted otherwise:

- Install dependencies: `npm ci`
- Build shared package: `cd shared && npm run build`
- Start backend: `cd server && npm run dev`
- Start frontend: `cd client && npm run dev`
- Initialize DB (schema + seed): `cd server && npm run db:setup`
- Push DB schema changes: `cd server && npm run db:push`
- Auth smoke test: `cd server && npm run smoke:auth`
- Run all automated tests: `npm test`
- Run test coverage across all workspaces: `npm run test:coverage`

## Seeded Test Identities
The local seed data includes the shared mentor and GA identities below for smoke testing and workflow verification:

- `mentorA@slu.edu`
- `mentorB@slu.edu`
- `gaA@slu.edu`
- `gaB@slu.edu`
- `gaC@slu.edu`
- `gaD@slu.edu`

If you need credentials for those accounts, retrieve them from the team’s approved secret store instead of committing them to the repository.

---

## Local URLs (Health Checks)
Use these to verify everything is running correctly:

- Backend health: `http://localhost:3000/api/health`
- User API (not signed in): `http://localhost:3000/api/me` (expected 401)
- Database UI (pgAdmin): `http://localhost:8080`
- Okta login start: `http://localhost:3000/api/auth/signin/okta`

---

## Docs Index
Helpful references in `docs/`:

- Setup guide: `docs/setup.md`
- Okta setup + smoke test: `docs/OKTA_SETUP_AND_SMOKE_TEST.md`
- Auth tables and flow: `docs/AUTH_TABLES_AND_FLOW.md`
- Appointment status enum: `docs/status-enum.md`

## Workflow Summary
The annual evaluation lifecycle now progresses through these statuses:

`AwaitingExpectationSetting -> ExpectationSet -> AwaitingSelfEvaluation -> SelfEvaluationCompleted -> MentorEvaluationCompleted -> AwaitingSignOff -> FinalEvaluated`


---

## Contributing
We welcome contributors. Start with `CONTRIBUTING.md` for setup, issue labels, and PR expectations.

---

## Troubleshooting (Short List)
- If `npm ci` changes `package-lock.json`, don’t commit unless you added/updated a dependency.
- If the DB UI can’t connect, try `docker-compose down -v` and re-run setup.
- If auth fails, follow the policy/redirect checks in `docs/OKTA_SETUP_AND_SMOKE_TEST.md`.

---

## Tech Stack
This project uses a TypeScript-based stack across the frontend, backend, and database layers.

- **Frontend:** React + shadcn/ui
- **Backend:** Node.js + Drizzle ORM
- **Database:** PostgreSQL
- **Authentication:** Better Auth with a mock Okta / OIDC development flow

---

## License
This project is licensed under the BSD 3-Clause License. See `LICENSE` for details.
