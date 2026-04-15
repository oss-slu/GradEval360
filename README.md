# GradEval360

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

Some records may also appear in `AwaitingMentorEvaluation` when they are intentionally parked for mentor follow-up. The appointment details page is the main action surface for each remaining step after creation.

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
We use modern, industry-standard tools. If you are new to these, don't worry! Each sprint is designed to help you learn them piece-by-piece.

- **Frontend:** React + shadcn/ui (Beautiful, accessible UI components).
- **Backend:** Node.js + Drizzle ORM (A simple way to talk to our database using TypeScript).
- **Database:** PostgreSQL (Running inside a Docker container).
- **Authentication:** Better-auth (Handles our Mock Okta / OIDC login flow).

---

## License
This project is licensed under the BSD 3-Clause License. See `LICENSE` for details.
