// client/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

const AUTH_BASE_URL = "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
});

type AuthFetchInput = string | URL | Request;

export async function authFetch(input: AuthFetchInput, init?: RequestInit) {
  const resolvedInput =
    typeof input === "string" && !input.startsWith("http")
      ? `${AUTH_BASE_URL}${input.startsWith("/") ? "" : "/"}${input}`
      : input;
  return fetch(resolvedInput, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
