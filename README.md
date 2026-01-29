# GradEval360

Welcome to the **GradEval360** development team! This project is the centralized performance management platform for Saint Louis University's Graduate Assistants.

## Project Focus: Spring 2026
Our goal for this semester is to complete the **Expectation Setting** workflow. This is the first and most critical step in the GA lifecycle, where GAs and Mentors agree on goals and responsibilities.

---

## How to Get Started
We have a dedicated guide to help you set up your machine. **Please follow this first to ensure your environment is ready:**

**[Read the Setup Guide (SETUP.md)](./SETUP.md)**

---

## Project Structure
This is a **monorepo**, meaning all the code for the website, the server, and the database lives in this one folder. Here is a map of the project to help you find your way:

```text
GradEval360/
├── client/          # Frontend (React + Vite)
│   ├── src/components/ # Reusable UI pieces (Buttons, Inputs, Sidebar)
│   ├── src/pages/      # Full views (Login, Dashboard, Appointments)
│   └── src/lib/        # Configuration (Auth client, API fetchers)
├── server/          # Backend (Express.js)
│   ├── src/db/         # Database schema, migrations, and seed data
│   ├── src/routes/     # API endpoints (The URLs the frontend calls)
│   └── src/middleware/ # Security checks (Checking if you are logged in)
├── shared/          # Shared Logic (The "Glue")
│   └── src/            # Data validation schemas used by both folders
├── docker/          # Database configuration files
└── docker-compose.yml  # The "Command Center" to start your database
```

---

## Tech Stack
We use modern, industry-standard tools. If you are new to these, don't worry! Each sprint is designed to help you learn them piece-by-piece.

- **Frontend:** React + shadcn/ui (Beautiful, accessible UI components).
- **Backend:** Node.js + Drizzle ORM (A simple way to talk to our database using TypeScript).
- **Database:** PostgreSQL (Running inside a Docker container).
- **Authentication:** Better-auth (Handles our Mock Okta / OIDC login flow).