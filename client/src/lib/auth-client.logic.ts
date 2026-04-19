const AUTH_BASE_URL = "http://localhost:3000";

export function resolveAuthFetchInput(input: string | URL | Request) {
  if (typeof input === "string" && !input.startsWith("http")) {
    return `${AUTH_BASE_URL}${input.startsWith("/") ? "" : "/"}${input}`;
  }

  return input;
}

export { AUTH_BASE_URL };
