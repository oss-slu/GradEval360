type JsonObject = Record<string, unknown>;

const baseURL = process.env.AUTH_SMOKE_BASE_URL ?? "http://localhost:3000";

async function assertOk(response: Response, label: string): Promise<Response> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed: ${response.status} ${response.statusText}\n${body}`);
  }
  return response;
}

async function run(): Promise<void> {
  console.log(`[auth-smoke] baseURL=${baseURL}`);

  const healthRes = await assertOk(
    await fetch(`${baseURL}/api/health`),
    "GET /api/health",
  );
  const health = (await healthRes.json()) as JsonObject;
  if (health.status !== "active") {
    throw new Error(`Expected health.status to be "active", got ${String(health.status)}`);
  }
  console.log("[auth-smoke] /api/health OK");

  const compatRes = await assertOk(
    await fetch(`${baseURL}/api/auth/signin/okta`),
    "GET /api/auth/signin/okta",
  );
  const compatHtml = await compatRes.text();
  if (!compatHtml.includes("/api/auth/signin/okta/redirect.js")) {
    throw new Error("Compatibility signin page is missing redirect.js reference");
  }
  console.log("[auth-smoke] /api/auth/signin/okta OK");

  const jsRes = await assertOk(
    await fetch(`${baseURL}/api/auth/signin/okta/redirect.js`),
    "GET /api/auth/signin/okta/redirect.js",
  );
  const jsBody = await jsRes.text();
  if (!jsBody.includes('/api/auth/sign-in/oauth2')) {
    throw new Error("redirect.js is not targeting /api/auth/sign-in/oauth2");
  }
  console.log("[auth-smoke] /api/auth/signin/okta/redirect.js OK");

  const oauthRes = await assertOk(
    await fetch(`${baseURL}/api/auth/sign-in/oauth2`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providerId: "okta",
        callbackURL: "http://localhost:5173",
      }),
    }),
    "POST /api/auth/sign-in/oauth2",
  );
  const oauth = (await oauthRes.json()) as JsonObject;
  const oauthUrl = String(oauth.url ?? "");
  if (!oauthUrl.includes("/authorize")) {
    throw new Error("OAuth response missing authorize URL");
  }
  if (!oauthUrl.includes("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth2%2Fcallback%2Fokta")) {
    throw new Error("OAuth response has unexpected redirect_uri");
  }
  console.log("[auth-smoke] /api/auth/sign-in/oauth2 OK");

  console.log("[auth-smoke] PASS");
}

run().catch((error) => {
  console.error("[auth-smoke] FAIL");
  console.error(error);
  process.exit(1);
});

