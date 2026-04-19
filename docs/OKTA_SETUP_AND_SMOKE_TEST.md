# Okta App Setup and Smoke Test (GradEval360)

This guide documents how to create and configure the Mock Okta app for local development, and how to run the auth smoke test.

## 1. Create Okta Application

1. Open `https://developer.okta.com/` and sign in to your Okta developer org.
2. Go to **Applications** -> **Applications** -> **Create App Integration**.
3. Choose:
   - **Sign-in method**: `OIDC - OpenID Connect`
   - **Application type**: `Web Application`
4. Set app name, for example: `GradEval360-Local`.
5. Configure **Sign-in redirect URIs**:
   - `http://localhost:3000/api/auth/oauth2/callback/okta`
   - `http://localhost:3000/api/auth/callback/okta` (compatibility alias)
6. Configure **Sign-out redirect URIs** (optional):
   - `http://localhost:5173`
7. Save and copy:
   - **Client ID**
   - **Client Secret**
   - **Issuer URL** (typically `https://<your-subdomain>.okta.com/oauth2/default`)

## 2. Configure Server Environment

Update `server/.env`:

```env
OKTA_ISSUER_URL=https://<your-subdomain>.okta.com/oauth2/default
OKTA_CLIENT_ID=<your_client_id>
OKTA_CLIENT_SECRET=<your_client_secret>
BETTER_AUTH_URL=http://localhost:3000
OKTA_POST_LOGIN_REDIRECT_URL=http://localhost:5173
```

## 3. Required Okta Customizations

### A. Authorization Server access policy (critical)

If you see `FAILURE: no_matching_policy` in Okta logs:

1. Go to **Security** -> **API** -> **Authorization Servers** -> `default`.
2. Open **Access Policies**.
3. Create/Edit policy including your app client (`GradEval360-Local`).
4. Add a rule that allows:
   - **Grant type**: `Authorization Code`
   - **Scopes**: `openid`, `profile`, `email`
   - **User**: your test user/group
5. Move this rule above restrictive catch-all rules.

### B. App sign-on policy / user access

If you see `You are not allowed to access this app`:

1. Open app -> **Sign On** -> **User authentication**.
2. Ensure policy/rules allow your user context.
3. If MFA is required (for example `Any two factors`), enroll required factors for the test user.

### C. Test user

Use an Okta user with an email that exists in seed data, e.g.:

- `mentorA@slu.edu`
- `mentorB@slu.edu`
- `gaA@slu.edu`
- `gaB@slu.edu`
- `gaC@slu.edu`
- `gaD@slu.edu`
- `premkiran.polepalli@slu.edu`
- `darcy.mupenda@slu.edu`
- `elizabeth.dreste@slu.edu`

Source: `server/src/db/seed.ts`

For the shared mentor and GA test identities above, retrieve credentials from the team’s approved secret store if you create matching users in your Okta test org.

## 4. Start Local Services

In separate terminals:

1. Server:
```bash
cd server
npm run dev
```

2. Client:
```bash
cd client
npm run dev
```

## 5. Manual Login Verification

1. Open:
   - `http://localhost:3000/api/auth/signin/okta`
2. Complete Okta login.
3. After callback, verify session:
   - `http://localhost:3000/api/health`
4. Confirm `currentUser` is populated in response JSON.

## 6. Run Smoke Test

The smoke test validates auth endpoints and OAuth initiation.

```bash
cd server
npm run smoke:auth
```

Expected output ends with:

```text
[auth-smoke] PASS
```

## 7. Troubleshooting

- `invalid_request: redirect_uri must be a Login redirect URI`
  - Add exact callback URI used by backend:
    - `http://localhost:3000/api/auth/oauth2/callback/okta`

- `no_matching_policy` (AuthorizationServer default)
  - Fix authorization server **Access Policies** (Section 3A).

- `You are not allowed to access this app`
  - Fix app sign-on policy / MFA / user rule (Section 3B).

- `user_info_is_missing`
  - Verify issuer is correct and includes `/oauth2/default` if using custom auth server.
  - Ensure scopes include `openid profile email`.
