import assert from "node:assert/strict";
import test from "node:test";

import { generateAppointmentCode } from "../../src/lib/appointment-code.js";

test("generateAppointmentCode uses the expected prefix and date format", () => {
  const code = generateAppointmentCode(new Date("2026-04-18T12:00:00.000Z"));

  assert.match(code, /^GEA-20260418-[A-Z0-9]{6}$/);
});

test("generateAppointmentCode creates different random suffixes for repeated calls", () => {
  const first = generateAppointmentCode(new Date("2026-04-18T12:00:00.000Z"));
  const second = generateAppointmentCode(new Date("2026-04-18T12:00:00.000Z"));

  assert.notEqual(first, second);
});
