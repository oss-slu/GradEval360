export {};

type JsonRecord = Record<string, unknown>;

const baseURL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  console.log(`[integration] baseURL=${baseURL}`);

  const healthRes = await fetch(`${baseURL}/api/health`);
  assert(healthRes.ok, `GET /api/health failed with ${healthRes.status}`);
  const healthBody = (await healthRes.json()) as JsonRecord;
  assert(healthBody.status === "active", "Expected /api/health status to be active");
  assert(typeof healthBody.userCount === "number", "Expected /api/health userCount to be a number");
  console.log("[integration] /api/health OK");

  const signinRes = await fetch(`${baseURL}/api/auth/signin/okta`);
  assert(signinRes.ok, `GET /api/auth/signin/okta failed with ${signinRes.status}`);
  const signinHtml = await signinRes.text();
  assert(
    signinHtml.includes("/api/auth/signin/okta/redirect.js"),
    "Signin page missing redirect.js reference",
  );
  console.log("[integration] /api/auth/signin/okta OK");

  const redirectScriptRes = await fetch(`${baseURL}/api/auth/signin/okta/redirect.js`);
  assert(
    redirectScriptRes.ok,
    `GET /api/auth/signin/okta/redirect.js failed with ${redirectScriptRes.status}`,
  );
  const redirectScriptBody = await redirectScriptRes.text();
  assert(
    redirectScriptBody.includes("/api/auth/sign-in/oauth2"),
    "redirect.js missing /api/auth/sign-in/oauth2 call",
  );
  console.log("[integration] /api/auth/signin/okta/redirect.js OK");

  const callbackCompatRes = await fetch(
    `${baseURL}/api/auth/callback/okta?code=test-code&state=test-state`,
    { redirect: "manual" },
  );
  assert(
    callbackCompatRes.status === 302,
    `Expected /api/auth/callback/okta to return 302, got ${callbackCompatRes.status}`,
  );
  const location = callbackCompatRes.headers.get("location") ?? "";
  assert(
    location === "/api/auth/oauth2/callback/okta?code=test-code&state=test-state",
    `Unexpected callback redirect location: ${location}`,
  );
  console.log("[integration] /api/auth/callback/okta compatibility OK");

  console.log("[integration] PASS");
}

run().catch((error) => {
  console.error("[integration] FAIL");
  console.error(error);
  process.exit(1);
});
