import assert from "node:assert/strict";
import test from "node:test";

import {
  AUDIT_ACTIONS,
  DEFAULT_AUDIT_LIMIT,
  MAX_AUDIT_LIMIT,
  buildAuditDescription,
  canViewAuditLogs,
  getAuditUnitScope,
  getRangeStart,
  parseAuditLogQuery,
  toLikePattern,
  type AuditAction,
} from "../../src/routes/audit-logs.logic.js";

const VALID_UUID = "6f1c2c1e-8a4b-4d2a-9f3e-1b2c3d4e5f60";

test("parseAuditLogQuery returns defaults for an empty query", () => {
  assert.deepEqual(parseAuditLogQuery({}), {
    search: null,
    actorId: null,
    range: "all",
    limit: DEFAULT_AUDIT_LIMIT,
  });
});

test("parseAuditLogQuery trims search, keeps valid filters, and caps limit", () => {
  const result = parseAuditLogQuery({
    search: "  Mentor A  ",
    actorId: VALID_UUID,
    range: "7d",
    limit: "9999",
  });

  assert.equal(result.search, "Mentor A");
  assert.equal(result.actorId, VALID_UUID);
  assert.equal(result.range, "7d");
  assert.equal(result.limit, MAX_AUDIT_LIMIT);
});

test("parseAuditLogQuery rejects invalid actor ids, ranges, and limits", () => {
  const result = parseAuditLogQuery({
    search: "   ",
    actorId: "not-a-uuid",
    range: "forever",
    limit: "-5",
  });

  assert.equal(result.search, null);
  assert.equal(result.actorId, null);
  assert.equal(result.range, "all");
  assert.equal(result.limit, DEFAULT_AUDIT_LIMIT);
});

test("parseAuditLogQuery uses the first value of repeated params and truncates long searches", () => {
  const result = parseAuditLogQuery({
    search: ["x".repeat(150), "ignored"],
    limit: 50,
  });

  assert.equal(result.search?.length, 100);
  assert.equal(result.limit, DEFAULT_AUDIT_LIMIT);
});

test("getRangeStart returns null for all and start-of-day boundaries otherwise", () => {
  const now = new Date(2026, 9, 25, 15, 30);

  assert.equal(getRangeStart("all", now), null);
  assert.deepEqual(getRangeStart("today", now), new Date(2026, 9, 25));
  assert.deepEqual(getRangeStart("7d", now), new Date(2026, 9, 19));
  assert.deepEqual(getRangeStart("30d", now), new Date(2026, 8, 26));
  assert.deepEqual(getRangeStart("90d", now), new Date(2026, 6, 28));
});

test("getRangeStart defaults to the current time", () => {
  const start = getRangeStart("today");
  assert.ok(start instanceof Date);
  assert.ok(start.getTime() <= Date.now());
});

test("toLikePattern wraps input and escapes LIKE wildcards", () => {
  assert.equal(toLikePattern("GEA"), "%GEA%");
  assert.equal(toLikePattern("50%_off\\"), "%50\\%\\_off\\\\%");
});

test("getAuditUnitScope mirrors appointment visibility rules", () => {
  assert.deepEqual(
    getAuditUnitScope({ id: "1", role: "Admin", unitIds: ["UNIT-A", "UNIT-B"], unitId: "UNIT-A" }),
    ["UNIT-A", "UNIT-B"],
  );
  assert.deepEqual(getAuditUnitScope({ id: "1", role: "Admin", unitIds: [], unitId: "UNIT-B" }), ["UNIT-B"]);
  assert.equal(getAuditUnitScope({ id: "1", role: "Admin" }), null);
});

test("canViewAuditLogs only allows admins", () => {
  assert.equal(canViewAuditLogs({ role: "Admin" }), true);
  assert.equal(canViewAuditLogs({ role: "Mentor" }), false);
  assert.equal(canViewAuditLogs({ role: "GA" }), false);
  assert.equal(canViewAuditLogs(null), false);
});

test("buildAuditDescription produces readable text for every action", () => {
  assert.equal(buildAuditDescription(AUDIT_ACTIONS.APPOINTMENT_CREATED, "GA A"), "Created appointment for GA A");
  assert.equal(buildAuditDescription(AUDIT_ACTIONS.EXPECTATIONS_SET, "GA A"), "Set expectations for GA A");
  assert.equal(buildAuditDescription(AUDIT_ACTIONS.EXPECTATIONS_ACKNOWLEDGED, "GA A"), "Acknowledged expectations");
  assert.equal(buildAuditDescription(AUDIT_ACTIONS.SELF_EVALUATION_SUBMITTED), "Submitted self-evaluation");
  assert.equal(
    buildAuditDescription(AUDIT_ACTIONS.MENTOR_EVALUATION_SUBMITTED, "GA B"),
    "Submitted evaluation for GA B",
  );
  assert.equal(buildAuditDescription(AUDIT_ACTIONS.SIGN_OFF_PREPARED, "GA C"), "Prepared sign-off for GA C");
  assert.equal(buildAuditDescription(AUDIT_ACTIONS.FINAL_SIGN_OFF, "  "), "Finalized sign-off for graduate assistant");
  assert.equal(buildAuditDescription("SomethingElse" as AuditAction), "SomethingElse");
});
