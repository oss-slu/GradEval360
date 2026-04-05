# Server Auth Tables and Authentication Flow

This document explains why the server has separate auth tables, how they are used, and how they connect to Okta + Better Auth.

## Why We Have Separate Tables

The server uses two sets of user data:

1. **Domain users table** (`users`)
- Purpose: business/domain identity for GradEval360 (Admin/GA/Mentor assignments used by app features).
- Defined in: `server/src/db/schema.ts` (`users`).

2. **Authentication tables** (`user`, `session`, `account`, `verification`)
- Purpose: session, OAuth account linkage, login state, and OAuth state verification for Better Auth.
- Defined in: `server/src/db/schema.ts` (`authUsers`, `authSessions`, `authAccounts`, `authVerifications`).

Keeping these concerns separate makes auth provider integration easier and protects business data from auth-provider coupling.

## Auth Tables and Their Roles

## `user` (`authUsers`)
- Stores authenticated user profile used by Better Auth.
- Key fields:
  - `id`
  - `email`
  - `name`
  - `role` (custom additional field, default `GA`)

## `session` (`authSessions`)
- Stores active login sessions.
- Used when backend resolves current user via cookie/session token.

## `account` (`authAccounts`)
- Stores OAuth provider link to auth user.
- For Okta, links `providerId="okta"` + provider account id to local auth user id.

## `verification` (`authVerifications`)
- Stores temporary verification/state records (including OAuth state during redirect flow).
- Required for OAuth initiation and callback validation.

## How Better Auth Is Wired

Auth config file: `server/src/db/auth.ts`

The Drizzle adapter explicitly maps Better Auth models to the auth tables:

- `user -> authUsers`
- `session -> authSessions`
- `account -> authAccounts`
- `verification -> authVerifications`

If one of these mappings or tables is missing, OAuth login fails (common error: model/table not found).

## Okta Login Flow (Current Implementation)

1. Browser opens `GET /api/auth/signin/okta` (compatibility route in `server/src/index.ts`).
2. That route triggers `POST /api/auth/sign-in/oauth2` with `providerId: "okta"`.
3. Better Auth creates OAuth state in `verification`.
4. User is redirected to Okta.
5. Okta redirects back to `/api/auth/oauth2/callback/okta`.
6. Better Auth resolves user info, creates/updates `user`, `account`, and `session`.

## Role Resolution Logic

Roles shown in UI come from authenticated user session data.

During Okta sign-in, role is resolved by email from domain table `users` and mapped into auth user:

- file: `server/src/db/auth.ts`
- helper: `resolveRoleByEmail(email)`

This ensures users like `premkiran.polepalli@slu.edu` get `Admin` (from seeded domain data), not always default `GA`.

## Important Environment Variables

In `server/.env`:

- `OKTA_ISSUER_URL`
- `OKTA_CLIENT_ID`
- `OKTA_CLIENT_SECRET`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `OKTA_POST_LOGIN_REDIRECT_URL` (compatibility route callback target)

## Required DB Setup

After schema changes, ensure tables exist:

```bash
cd server
npm run db:push
```

Recommended local setup command:

```bash
cd server
npm run db:setup
```

## Smoke Test

Run auth smoke test:

```bash
cd server
npm run smoke:auth
```

Expected:

```text
[auth-smoke] PASS
```

## Future Maintenance Notes

1. Do not remove `verification` table; OAuth depends on it.
2. Keep auth table names aligned with Better Auth model names unless adapter mappings are updated.
3. If role logic changes, update `resolveRoleByEmail` and re-test login.
4. For policy/redirect issues, use: `OKTA_SETUP_AND_SMOKE_TEST.md`.
