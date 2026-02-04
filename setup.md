# GradEval360 Setup Guide

Welcome to the **GE360** development team. This guide will help you get your local environment running from scratch.

---

## 1. Prerequisites

Before setting up the project, ensure your machine has the necessary tools. Run the verification commands to check if you already have them installed.

### A. Node.js (v20.x or higher) & NPM (v10.x or higher)
The runtime for our backend and frontend.
* **Verify:** `node -v` and `npm -v`
* **Install:** [Node](https://nodejs.org/en/download)
For windows users: We can go to above link and download the Windows installer (.msi) for the latest LTS version of Node.js. Run the installer and follow the prompts to complete the installation.

For macOS users, you can also use Homebrew or go to above linlk and do nvm installation. We recommend using nvm to manage Node versions, especially if you work on multiple projects.

### B. Docker Desktop
Required to run the PostgreSQL database and pgAdmin containers.
* **Verify:** `docker --version`
* **Install:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

### C. Git
For version control and pulling the repository.
* **Verify:** `git --version`
* **Install (macOS):** `brew install git`
* **Install (Windows):** [Download Git](https://git-scm.com/install/)
To prevent cross-platform line-ending issues (Windows vs Mac), run:
```bash
# Mac users:
git config --global core.autocrlf input

# Windows users:
git config --global core.autocrlf true
```

### D. TypeScript (Global)
* **Verify:** `tsc --version`
While we use local project dependencies, having the global compiler is helpful for CLI tools.
* **Install:** `npm install -g typescript`
---

## 2. Initial Installation
We use a monorepo-style structure. To keep the environment stable, always use `npm ci` instead of `npm install` when first setting up or after pulling changes.

```bash
# 1. Clone the repository
git clone https://github.com/oss-slu/GradEval360.git
cd GradEval360

# 2. Synchronize all workspaces (Root, Client, Server, Shared)
# This uses the root package-lock.json to manage the entire monorepo
npm ci

# 3. Build the Shared Schemas
# This compiles TypeScript into the .js files needed for module resolution
cd shared && npm run build

```

---

## 3. Environment Configuration
The application requires specific secrets for Okta and Database communication. Create a `.env` file in the `server` directory.
File: `server/.env`

```bash
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/gradeval360

# Okta OIDC Configuration (Get these from the Tech Lead)
OKTA_ISSUER_URL=[https://slu.okta.com](https://slu.okta.com)
OKTA_CLIENT_ID=your_okta_client_id
OKTA_CLIENT_SECRET=your_okta_client_secret

# Auth Settings
BETTER_AUTH_SECRET=a_long_random_string_here
BETTER_AUTH_URL=http://localhost:3000
```

---

## 4. Infrastructure & Database
We use Docker to ensure consistent environments.
1. **Start the containers:** From the project root:

```bash
docker-compose up -d
```
run `docker-compose down` to just stop the containers or run `docker-compose down -v` to wipe the volumes.

2. **Initialize the Database:** Sync your TypeScript models to the Postgres tables and add seed data.

```bash
cd server
npx drizzle-kit push   # Pushes schema to DB
npm run seed           # Adds initial team users
```

---

## 5. Verification (The Health Check) & Workflow

### Daily Workflow (To avoid Lockfile Conflicts)
1. `git pull`
2. `npm ci` (in the root folder). Do not commit changes to package-lock.json unless you have added a new dependency.
3. `npm run build` in \shared folder for Build Shared.

### Development Workflow
- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`

Verify your setup by visiting these local endpoints to ensure all services are communicating correctly.

| Service | URL | Expected Result |
| :--- | :--- | :--- |
| **Backend Health** | [http://localhost:3000/health](http://localhost:3000/health) | `{"status":"active", "dbConnection":"connected", "userCount": 5}` |
| **User API** | [http://localhost:3000/api/me](http://localhost:3000/api/me) | **401 Unauthorized** (Security is working) |
| **Database UI** | [http://localhost:8080](http://localhost:8080) | **Login:** `admin@gradeval.com` / `admin` |

## 6. Testing
Run the automated test suite from the root to confirm everything is functional:
```bash
npm test
```

### Quick Troubleshooting
* **Connection Refused:** Ensure your local server or Docker containers are running on ports `3000` and `8080`.
* **JSON Mismatch:** If `userCount` is not `5`, verify that your database seed script ran successfully.
* **Login Issues:** Double-check that there are no trailing spaces in the credentials provided for the Database UI.

## Troubleshooting
- pgAdmin "Service not found": If you get a connection error in pgAdmin, right-click the GradEval-Local server, go to Properties > Connection, and ensure the Service field is empty and the Host is set to `db`.
- TypeScript Red Lines: If VS Code shows errors in the `shared` folder, run `Cmd + Shift + P` and select "TypeScript: Restart TS Server".
- Clean Reset: If your database becomes inconsistent, run `docker-compose down -v` to wipe the volumes and restart from Step 4.

