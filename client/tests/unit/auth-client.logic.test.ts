import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_BASE_URL, resolveAuthFetchInput } from "../../src/lib/auth-client.logic.js";

test("resolveAuthFetchInput prefixes relative API paths", () => {
  assert.equal(resolveAuthFetchInput("/api/appointments"), `${AUTH_BASE_URL}/api/appointments`);
  assert.equal(resolveAuthFetchInput("api/appointments"), `${AUTH_BASE_URL}/api/appointments`);
});

test("resolveAuthFetchInput leaves absolute URLs unchanged", () => {
  const url = "https://example.com/health";
  assert.equal(resolveAuthFetchInput(url), url);
});
