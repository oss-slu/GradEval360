const AUTH_BASE_URL = "http://localhost:3000";

export function resolveAuthFetchInput(input: string | URL | Request) {
  if (typeof input === "string" && !input.startsWith("http")) {
    return `${AUTH_BASE_URL}${input.startsWith("/") ? "" : "/"}${input}`;
  }

  return input;
}

export function getUserRole(session: unknown): string | null {
  const user = (session as any)?.user;

  const userRoleRaw =
    user?.role ??
    user?.userRole ??
    user?.metadata?.role;

  return userRoleRaw ? String(userRoleRaw) : null;
}

export { AUTH_BASE_URL };
