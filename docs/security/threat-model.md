# GradEval360 — Living Threat Model

- **Repository:** [oss-slu/GradEval360](https://github.com/oss-slu/GradEval360)
- **License:** BSD 3-Clause License
- **Target Organization:** Saint Louis University (Graduate Education)
- **Architecture:** React/Vite SPA (`client/`), Express.js API (`server/`), Drizzle ORM + PostgreSQL, Better Auth + Okta OIDC, Shared Zod Schemas (`shared/`)
- **Methodology:** State-Machine STRIDE + Risk-Centric PASTA
- **Status:** Active / Living Document (Every milestone PR modifying routes in `server/src/routes/` or schemas in `shared/schemas/` should review and update this file)

---

## 1. Executive Summary

GradEval360 is the centralized performance evaluation and appointment workflow platform for Saint Louis University's Graduate Assistants (GAs), Faculty Mentors, and Graduate Education Administrators. Because the system governs an eight-stage annual evaluation lifecycle—culminating in formal administrative sign-off (`FinalEvaluated`) that directly impacts student academic standing, stipend renewals, and employment records—its primary security imperatives are **confidentiality of educational/employment records (FERPA alignment)** and **strict workflow state-transition integrity**.

Combining STRIDE with risk-centric PASTA considerations, our assessment highlights three top risks:
1. **Cross-Role Authorization & State-Machine Bypass:** Where a GA or unauthorized mentor could read confidential evaluations or skip mandatory approval states.
2. **Session & OIDC Configuration Vulnerabilities:** Around Better Auth, Okta OIDC callbacks, and local administrative database tools (`pgAdmin` on port 8080).
3. **Open-Source Supply Chain & Seed Identity Leakage:** In a public monorepo containing shared Zod contracts, database scripts, and test accounts.

---

## 2. Product Context & Regulated Assets

GradEval360 orchestrates a multi-party annual evaluation workflow progressing sequentially through eight states:

```text
AwaitingExpectationSetting -> ExpectationSet -> AwaitingMentorFinalization ->
AwaitingSelfEvaluation -> SelfEvaluationCompleted -> MentorEvaluationCompleted ->
AwaitingSignOff -> FinalEvaluated
```

### Critical Assets
- **Protected Educational & Employment Records (FERPA Scope):** Graduate Assistant self-evaluations, mentor performance ratings, narrative feedback, expectation agreements, and appointment statuses.
- **Identity & Session Artifacts:** SLU Okta OIDC tokens, Better Auth session cookies/records (`BETTER_AUTH_SECRET`), institutional emails, and role bindings (GA, Mentor, Admin).
- **Compliance & Governance Trails:** In-app notifications, status reports, and the administrative audit log capturing who finalized expectations, submitted evaluations, and executed final sign-off.

---

## 3. Attack Surface Analysis

GradEval360 is structured as a TypeScript monorepo comprising `client/` (React + Vite + shadcn/ui), `server/` (Express.js + Drizzle ORM), `shared/` (Zod validation schemas), and a containerized PostgreSQL + pgAdmin stack (`docker-compose.yml`).

| Entry Point / Component | Trust Boundary Crossed | Data Crossing Boundary | Primary Attack Surface |
| :--- | :--- | :--- | :--- |
| **React SPA Client** (`client/` on port 5173) | User Browser → Client Presentation Layer | Evaluation forms, narrative feedback, dashboard metrics, session cookies | Stored XSS in multi-line evaluation text fields; client-side route guard bypass |
| **Better Auth & Okta OIDC** (`/api/auth/signin/okta`) | SLU Okta IdP → Express Auth Middleware | OIDC authorization codes, ID tokens, `OKTA_CLIENT_SECRET`, session state | Open redirect via `OKTA_POST_LOGIN_REDIRECT_URL`; session fixation; CSRF |
| **Workflow REST Endpoints** (`server/src/routes/*.ts`) | Authenticated Role → Domain Logic & DB | Zod-validated JSON payloads, status transitions, evaluation scores | BOLA/IDOR across GA-Mentor pairs; state-machine skipping (e.g., jumping to `FinalEvaluated`) |
| **PostgreSQL & pgAdmin** (`docker-compose.yml` / `:8080`) | Server / Ops Network → Persistence Layer | All evaluation tables, Better Auth tables, audit logs, seed credentials | Exposed pgAdmin interface in non-local deployments; weak default DB passwords |
| **Admin Scripts & Shared Code** (`server/src/scripts/`, `shared/`) | CLI / Build Pipeline → Production Runtime | Seed identities (`mentorA@slu.edu`, `gaA@slu.edu`), backfill mutations | Accidental execution of seed/backfill scripts on production DB; schema drift |
| **Public GitHub Repository** (Issues, PRs, Actions CI) | External OSS Community → Main Branch | TypeScript source, Drizzle migrations, `.env` templates, test fixtures | Malicious PRs weakening middleware checks; dependency supply chain poisoning |

### User Roles & Trust Boundaries
- **Graduate Assistant (GA):** Can view and acknowledge their own expectations and submit their own self-evaluation during valid workflow states; must never view draft mentor evaluations prematurely or access other GAs' records.
- **Faculty / Staff Mentor:** Can draft and finalize expectations and submit evaluations strictly for assigned GAs; cannot perform administrative sign-off or view evaluations outside their mentorship scope.
- **Graduate Education Administrator:** Holds institutional oversight across all appointments, executes final sign-off (`AwaitingSignOff` → `FinalEvaluated`), views status reports, and inspects the admin audit log.

---

## 4. Threat Catalog (STRIDE & Open-Source Analysis)

| ID | Category | Threat Description | Potential Impact | Likelihood / Impact | Affected Components & Actors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | Information Disclosure | **Cross-Appointment IDOR:** An authenticated GA or Mentor queries `/api/evaluations/:id` with another student's appointment ID, bypassing mentorship relationship checks. | Breach of confidential student performance evaluations (FERPA violation) and institutional reputational harm. | **Likelihood:** Medium<br>**Impact:** Critical | `server/src/routes/`, `server/src/middleware/`; GAs & Mentors. |
| **T-02** | Tampering | **Workflow State-Machine Bypass:** A client submits direct API calls to transition an evaluation out of sequence (e.g., editing expectations after `FinalEvaluated` or self-approving sign-off). | Invalidation of official HR/academic evaluation records and circumvention of mandatory mentor/admin review gates. | **Likelihood:** Medium<br>**Impact:** High | `server/src/routes/*.logic.ts`, Drizzle DB state; GAs & Mentors. |
| **T-03** | Spoofing | **Seed Identity & OIDC Misconfiguration:** Seeded test accounts (`mentorA@slu.edu`, `gaA@slu.edu`) remain active in staging/production, or `BETTER_AUTH_SECRET` uses a weak/default string. | Unauthorized login as a seeded mentor or forging of Better Auth session tokens to impersonate administrators. | **Likelihood:** Low<br>**Impact:** Critical | `server/src/db/` seed scripts, Better Auth config; All Users. |
| **T-04** | Elevation of Privilege | **Exposed Database Admin UI (pgAdmin):** Container configuration from `docker-compose.yml` (port 8080) is carried into a network-accessible server deployment without firewall restrictions. | Direct read/write access to PostgreSQL tables, bypassing application RBAC and allowing silent alteration of audit logs. | **Likelihood:** Low<br>**Impact:** Critical | `docker-compose.yml`, `servers.json`, PostgreSQL; Ops / Admins. |
| **T-05** | Tampering / XSS | **Stored XSS via Evaluation Narratives:** Malicious script payloads embedded in expectation descriptions or self-evaluation comments execute when viewed by a Mentor or Admin. | Session hijacking of an Administrator account during evaluation review, leading to unauthorized final sign-offs. | **Likelihood:** Low<br>**Impact:** High | `client/src/features/`, `shared/schemas/`; Mentors & Admins. |
| **T-06** | Repudiation | **Audit Log Tampering or Gaps:** State transitions or administrative overrides occur without recording immutable actor IDs, timestamps, and before/after values, or admins can delete audit entries. | Inability to prove compliance during student grade/appointment appeals or internal HR audits. | **Likelihood:** Medium<br>**Impact:** Medium | Admin audit log endpoints & schema; Administrators. |
| **T-07** | Tampering (OSS) | **Malicious OSS PR or Dependency Drift:** Public contributors introduce subtle authorization bypasses in `server/src/middleware/` or compromised npm packages enter via unpinned updates. | Silent weakening of authentication checks or exfiltration of `OKTA_CLIENT_SECRET` during CI runs. | **Likelihood:** Medium<br>**Impact:** High | GitHub PR workflow, `package-lock.json`, `.github/` CI. |
| **T-08** | Denial of Service | **Notification & Report Query Exhaustion:** Unpaginated dashboard queries or automated notification triggers flood the Express server during peak end-of-semester evaluation deadlines. | System slowdown or outage precisely when hundreds of GAs and mentors must complete evaluations before deadlines. | **Likelihood:** Medium<br>**Impact:** Medium | `server/src/routes/` dashboard & notification handlers; All Users. |

---

## 5. Risk Prioritization Matrix

| Priority Tier | Threat IDs | Rationale | Target Timeline |
| :--- | :--- | :--- | :--- |
| **P1 — Immediate** | T-01, T-02, T-03 | Protects core FERPA confidentiality, enforces the 8-state evaluation lifecycle, and hardens Better Auth / Okta production secrets. | Current Milestone (Before Milestone 2 production rollout) |
| **P2 — Near-Term** | T-04, T-05, T-06 | Secures deployment infrastructure (pgAdmin isolation), hardens rich-text rendering, and guarantees tamper-evident audit logging. | Next 1–2 Sprints (Pre-semester deployment checklist) |
| **P3 — Long-Term** | T-07, T-08 | Strengthens open-source contribution guardrails, automated dependency auditing, and peak-load pagination/rate limiting. | Ongoing / Maintenance Handoff |

---

## 6. Mitigation Strategy & Engineering Trade-offs

GradEval360's clean separation between HTTP orchestration (`*.ts`), pure state-transition logic (`*.logic.ts`), and shared Zod schemas (`shared/schemas/`) enables high-assurance security controls with minimal architectural friction.

| Threat | Planned & Recommended Security Controls | Engineering & Usability Trade-offs | Status |
| :--- | :--- | :--- | :--- |
| **T-01 & T-02** (BOLA & State Machine) | Enforce relationship-based access control (ReBAC) in server middleware verifying active Mentor–GA pairing or Admin role on every record query. Encode the 8-state transition matrix inside pure functions in `server/src/routes/*.logic.ts` with exhaustive unit tests rejecting out-of-order or post-`FinalEvaluated` mutations. | Requires Administrators to use an explicit "Reopen Evaluation" audit-logged workflow if a finalized evaluation contains a clerical error, adding one extra step for rare corrections. | Planned |
| **T-03 & T-04** (Auth & DB Ops) | Block `db:setup` seed scripts when `NODE_ENV === 'production'`, enforce >=32-byte random `BETTER_AUTH_SECRET` validation on boot, pin exact `OKTA_POST_LOGIN_REDIRECT_URL` allowlists, and split `docker-compose.prod.yml` to exclude `pgAdmin`. | Operations staff must use SSH tunnels or institutional VPNs for direct database administration rather than a convenient web UI port. | Planned |
| **T-05 & T-06** (XSS & Audit Integrity) | Rely on React's default JSX escaping (ban `dangerouslySetInnerHTML`) and enforce strict length/character constraints in `shared/schemas/`. Restrict the PostgreSQL application role to `INSERT` and `SELECT` only (revoking `UPDATE`/`DELETE`) on the `audit_logs` table. | Limits rich-text formatting (e.g., custom HTML styling) in evaluation narratives in favor of plain text or safe Markdown. | Planned |
| **T-07 & T-08** (OSS & Availability) | Require CODEOWNERS review on `server/src/middleware/` and `server/src/db/`, run `npm audit` and `npm run smoke:auth` in GitHub Actions CI, and enforce server-side pagination and Express rate limiting on dashboard/notification routes. | Slightly increases CI runtime and adds minor code review overhead for external student contributors touching authentication or database files. | Backlog |

---

## 7. Open Questions for Future Cohorts & OSS-Cybersecurity

1. **Mentor Reassignment Mid-Cycle:** If a Graduate Assistant changes advisors mid-semester, should the incoming mentor inherit read access to prior draft expectations, or should historical drafts remain sealed to the original mentor and admin?
2. **Data Retention & Archival Policy:** After a Graduate Assistant graduates or leaves SLU, what is the required retention window for `FinalEvaluated` records before anonymization or archival export?
3. **Email vs. In-App Notification Privacy:** If email notifications are added in future milestones, how will the system ensure sensitive evaluation text is never leaked in email bodies (sending only generic portal links instead)?
4. **SSO Role Synchronization:** Are user roles (GA vs. Mentor vs. Admin) derived dynamically from SLU Okta group claims on every login, or persisted locally in Better Auth tables where stale privileges could linger after role changes?

---

## Changelog
- **Initial Assessment:** Created comprehensive state-machine STRIDE & PASTA threat model covering `client/`, `server/`, Better Auth / Okta OIDC, and PostgreSQL/pgAdmin deployment surfaces.
