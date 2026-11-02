import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuditLogsUrl,
  formatAuditTimestamp,
  getActorLabel,
  getActorOptionLabel,
  getAppointmentLabel,
  getResultCountLabel,
  normalizeAuditResponse,
} from "../../src/features/audit/audit-logs.logic.js";

test("buildAuditLogsUrl omits empty and 'all' filters", () => {
  assert.equal(buildAuditLogsUrl({ search: "  ", actorId: "all", range: "all" }), "/api/audit-logs");
});

test("buildAuditLogsUrl encodes active filters", () => {
  assert.equal(
    buildAuditLogsUrl({ search: " Mentor A ", actorId: "abc", range: "7d" }),
    "/api/audit-logs?search=Mentor+A&actorId=abc&range=7d",
  );
});

test("formatAuditTimestamp shows month, day, and time for the current year", () => {
  const now = new Date(2026, 9, 25);
  const value = new Date(2026, 9, 2, 9, 30).toISOString();
  assert.equal(formatAuditTimestamp(value, now), "Oct 2, 9:30 AM");
});

test("formatAuditTimestamp includes the year for older entries", () => {
  const now = new Date(2026, 9, 25);
  const value = new Date(2025, 8, 29, 23, 45).toISOString();
  assert.equal(formatAuditTimestamp(value, now), "Sep 29, 2025, 11:45 PM");
});

test("formatAuditTimestamp handles missing or invalid values", () => {
  assert.equal(formatAuditTimestamp(null), "—");
  assert.equal(formatAuditTimestamp("not a date"), "—");
  assert.notEqual(formatAuditTimestamp(new Date().toISOString()), "—");
});

test("getAppointmentLabel prefers the code, then a short id", () => {
  assert.equal(getAppointmentLabel({ appointmentCode: "GEA-1", appointmentId: "1234567890" }), "GEA-1");
  assert.equal(getAppointmentLabel({ appointmentCode: null, appointmentId: "1234567890" }), "12345678");
  assert.equal(getAppointmentLabel({ appointmentCode: null, appointmentId: null }), "—");
});

test("actor label helpers fall back gracefully", () => {
  assert.equal(getActorLabel({ actorName: "Mentor A" }), "Mentor A");
  assert.equal(getActorLabel({ actorName: null }), "Unknown user");
  assert.equal(getActorOptionLabel({ id: "1", fullName: "David Pan", role: "Admin" }), "David Pan (Admin)");
});

test("normalizeAuditResponse accepts objects, arrays, and junk", () => {
  const log = { id: "1" } as any;
  assert.deepEqual(normalizeAuditResponse({ logs: [log], actors: [] }), { logs: [log], actors: [] });
  assert.deepEqual(normalizeAuditResponse([log]), { logs: [log], actors: [] });
  assert.deepEqual(normalizeAuditResponse(null), { logs: [], actors: [] });
  assert.deepEqual(normalizeAuditResponse({ logs: "x" }), { logs: [], actors: [] });
});

test("getResultCountLabel pluralizes and shows loading", () => {
  assert.equal(getResultCountLabel(0, true), "Loading...");
  assert.equal(getResultCountLabel(1, false), "1 entry");
  assert.equal(getResultCountLabel(3, false), "3 entries");
});
