// client/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

/**
 * Dev setup:
 * - Frontend: http://localhost:5173
 * - Backend:  http://localhost:3000 (or :8080)
 *
 * Set VITE_API_BASE_URL in client/.env(.local) to your backend origin.
 */
const baseURL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
});
