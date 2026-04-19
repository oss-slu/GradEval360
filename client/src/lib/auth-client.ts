// client/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { AUTH_BASE_URL, resolveAuthFetchInput } from "./auth-client.logic";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
});

type AuthFetchInput = string | URL | Request;

export async function authFetch(input: AuthFetchInput, init?: RequestInit) {
  const resolvedInput = resolveAuthFetchInput(input);
  return fetch(resolvedInput, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
