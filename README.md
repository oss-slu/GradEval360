# GradEval360 - Development Environment

## Project Overview
[cite_start]GradEval360 is SLU's centralized performance management platform for Graduate Assistants[cite: 33]. 
[cite_start]This iteration (6 Sprints) focuses on the **Expectation Setting** workflow[cite: 56].

## Tech Stack
- [cite_start]**Frontend:** React (Vite) + shadcn/ui + React Query 
- [cite_start]**Backend:** Node.js (Express) + Drizzle ORM 
- [cite_start]**Database:** PostgreSQL (Running in Docker) 
- [cite_start]**Auth:** Better-auth (Okta OIDC Integration) 

## Getting Started

### 1. Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Install [Node.js](https://nodejs.org/) (v18 or higher)

### 2. Database Setup
Spin up the PostgreSQL database and pgAdmin:
```bash
docker-compose up -d
```
