import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db/index.js'; 
import { users } from './db/schema.js'; 
import { auth } from './db/auth.js';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import apiRouter from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// 1. Health Check (Top Level)
const healthHandler = async (req: express.Request, res: express.Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const allUsers = await db.select().from(users);

    res.json({ 
      status: 'active', 
      dbConnection: 'connected', 
      userCount: allUsers.length,
      currentUser: session?.user || "No active session" 
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ status: 'error', message: 'Auth/DB check failed' });
  }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Compatibility route for Mock Okta sign-in flow described in GE360-01.
app.get("/api/auth/signin/okta", (_req, res) => {
  const callbackURL = process.env.OKTA_POST_LOGIN_REDIRECT_URL || "http://localhost:5173";
  const redirectScriptSrc = `/api/auth/signin/okta/redirect.js?callbackURL=${encodeURIComponent(callbackURL)}`;
  const html = `<!doctype html>
<html>
  <body>
    <p>Redirecting to Okta...</p>
    <noscript>JavaScript is required for this sign-in shortcut. Use your app login flow instead.</noscript>
    <script src="${redirectScriptSrc}"></script>
  </body>
</html>`;
  res.status(200).type("html").send(html);
});

app.get("/api/auth/signin/okta/redirect.js", (req, res) => {
  const callbackURLParam = Array.isArray(req.query.callbackURL)
    ? req.query.callbackURL[0]
    : req.query.callbackURL;
  const callbackURL =
    typeof callbackURLParam === "string" && callbackURLParam.length > 0
      ? callbackURLParam
      : "http://localhost:5173";

  const script = `
const callbackURL = ${JSON.stringify(callbackURL)};
fetch("/api/auth/sign-in/oauth2", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ providerId: "okta", callbackURL }),
})
  .then(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to start Okta sign-in.");
    }
    return response.json();
  })
  .then((payload) => {
    if (!payload?.url) {
      throw new Error("Missing redirect URL from auth response.");
    }
    window.location.assign(payload.url);
  })
  .catch((error) => {
    document.body.innerHTML = "<pre>" + String(error?.message || error) + "</pre>";
  });
`;
  res
    .status(200)
    .type("application/javascript")
    .send(script);
});

// Okta can be configured with /api/auth/callback/okta in dashboard; Better Auth handles /oauth2/callback/okta.
app.get("/api/auth/callback/okta", (req, res) => {
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(302, `/api/auth/oauth2/callback/okta${query}`);
});

// 2. Auth Handler
app.all("/api/auth/*", toNodeHandler(auth));

// 3. API Routes
app.use("/api", apiRouter);

// 4. Root
app.get('/', (req, res) => res.send('GradEval360 API Online.'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
