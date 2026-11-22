import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKFILL_DESCRIPTION_SUFFIX,
  buildBackfillEntries,
  filterExistingEntries,
  hasReachedStatus,
  parseTimestamp,
  pickFallbackAdminId,
  type BackfillAppointment,
  type BackfillContext,
} from "../../src/lib/audit-backfill.logic.js";
import { AUDIT_ACTIONS } from "../../src/routes/audit-logs.logic.js";

const CREATED = "2026-01-05T10:00:00.000Z";

function makeAppointment(overrides: Partial<BackfillAppointment> = {}): BackfillAppointment {
  return {
    id: "appt-1",
    gaId: "ga-1",
    mentorId: "mentor-1",
    status: "AwaitingExpectationSetting",
    createdAt: CREATED,
    expectationData: {},
    mentorEvaluationData: {},
    ...overrides,
  };
}

function makeContext(overrides: Partial<BackfillContext> = {}): BackfillContext {
  return {
    gaName: "GA A",
    findUserIdByName: (name) => (name === "Admin One" ? "admin-1" : null),
    fallbackAdminId: "admin-fallback",
    ...overrides,
  };
}

test("hasReachedStatus follows workflow order and rejects unknown statuses", () => {
  assert.equal(hasReachedStatus("FinalEvaluated", "ExpectationSet"), true);
  assert.equal(hasReachedStatus("ExpectationSet", "ExpectationSet"), true);
  assert.equal(hasReachedStatus("ExpectationSet", "AwaitingSelfEvaluation"), false);
  assert.equal(hasReachedStatus("NotAStatus", "ExpectationSet"), false);
  assert.equal(hasReachedStatus("FinalEvaluated", "NotAStatus"), false);
});

test("parseTimestamp accepts dates and ISO strings and rejects junk", () => {
  const date = new Date(CREATED);
  assert.equal(parseTimestamp(date), date);
  assert.equal(parseTimestamp(new Date("nope")), null);
  assert.equal(parseTimestamp(CREATED)?.toISOString(), CREATED);
  assert.equal(parseTimestamp("2026-03-10")?.toISOString(), "2026-03-10T00:00:00.000Z");
  assert.equal(parseTimestamp("not a date"), null);
  assert.equal(parseTimestamp("  "), null);
  assert.equal(parseTimestamp(42), null);
  assert.equal(parseTimestamp(undefined), null);
});

test("a new appointment only gets a creation entry from the mentor", () => {
  const entries = buildBackfillEntries(makeAppointment(), makeContext());

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    actorId: "mentor-1",
    actorRole: "Mentor",
    action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
    description: "Created appointment for GA A" + BACKFILL_DESCRIPTION_SUFFIX,
    appointmentId: "appt-1",
    createdAt: new Date(CREATED),
  });
});

test("a finished appointment gets every step with the right actors and stored times", () => {
  const appointment = makeAppointment({
    status: "FinalEvaluated",
    expectationData: {
      mentorAcknowledgedAt: "2026-01-10T00:00:00.000Z",
      gaAcknowledgedAt: "2026-01-12T00:00:00.000Z",
      mentorFinalized: true,
      mentorFinalizedAt: "2026-01-15T00:00:00.000Z",
    },
    mentorEvaluationData: {
      evaluationSubmittedAt: "2026-04-01T00:00:00.000Z",
      signOffPreparedAt: "2026-04-02T00:00:00.000Z",
      signOffPreparedBy: "Admin One",
      finalAcknowledgedAt: "2026-04-03T00:00:00.000Z",
      finalAcknowledgedBy: "Someone Unknown",
    },
  });

  const entries = buildBackfillEntries(appointment, makeContext());

  assert.deepEqual(
    entries.map((entry) => [entry.action, entry.actorId, entry.actorRole, entry.createdAt.toISOString()]),
    [
      [AUDIT_ACTIONS.APPOINTMENT_CREATED, "mentor-1", "Mentor", CREATED],
      [AUDIT_ACTIONS.EXPECTATIONS_SET, "mentor-1", "Mentor", "2026-01-10T00:00:00.000Z"],
      [AUDIT_ACTIONS.EXPECTATIONS_ACKNOWLEDGED, "ga-1", "GA", "2026-01-12T00:00:00.000Z"],
      [AUDIT_ACTIONS.EXPECTATIONS_FINALIZED, "mentor-1", "Mentor", "2026-01-15T00:00:00.000Z"],
      // No stored time for self-evaluation, so it reuses the previous step's time.
      [AUDIT_ACTIONS.SELF_EVALUATION_SUBMITTED, "ga-1", "GA", "2026-01-15T00:00:00.000Z"],
      [AUDIT_ACTIONS.MENTOR_EVALUATION_SUBMITTED, "mentor-1", "Mentor", "2026-04-01T00:00:00.000Z"],
      [AUDIT_ACTIONS.SIGN_OFF_PREPARED, "admin-1", "Admin", "2026-04-02T00:00:00.000Z"],
      // Unknown admin name falls back to the unit's admin.
      [AUDIT_ACTIONS.FINAL_SIGN_OFF, "admin-fallback", "Admin", "2026-04-03T00:00:00.000Z"],
    ],
  );
  assert.ok(entries.every((entry) => entry.description.endsWith(BACKFILL_DESCRIPTION_SUFFIX)));
});

test("finalization is skipped for older appointments that never recorded it", () => {
  const entries = buildBackfillEntries(
    makeAppointment({ status: "AwaitingSelfEvaluation", expectationData: {} }),
    makeContext(),
  );

  assert.deepEqual(
    entries.map((entry) => entry.action),
    [AUDIT_ACTIONS.APPOINTMENT_CREATED, AUDIT_ACTIONS.EXPECTATIONS_SET, AUDIT_ACTIONS.EXPECTATIONS_ACKNOWLEDGED],
  );
});

test("finalization timestamp alone is enough to log it", () => {
  const entries = buildBackfillEntries(
    makeAppointment({
      status: "AwaitingSelfEvaluation",
      expectationData: { mentorFinalizedAt: "2026-01-20T00:00:00.000Z" },
    }),
    makeContext(),
  );

  assert.ok(entries.some((entry) => entry.action === AUDIT_ACTIONS.EXPECTATIONS_FINALIZED));
});

test("timestamps earlier than the previous step are moved forward to keep order", () => {
  const entries = buildBackfillEntries(
    makeAppointment({
      status: "AwaitingMentorFinalization",
      expectationData: { mentorAcknowledgedAt: "2025-12-01T00:00:00.000Z", gaAcknowledgedAt: "garbage" },
    }),
    makeContext(),
  );

  assert.deepEqual(
    entries.map((entry) => entry.createdAt.toISOString()),
    [CREATED, CREATED, CREATED],
  );
});

test("sign-off steps are skipped when no admin can be found", () => {
  const entries = buildBackfillEntries(
    makeAppointment({ status: "FinalEvaluated", mentorEvaluationData: { signOffPreparedBy: "Nobody" } }),
    makeContext({ fallbackAdminId: null }),
  );

  const actions = entries.map((entry) => entry.action);
  assert.ok(!actions.includes(AUDIT_ACTIONS.SIGN_OFF_PREPARED));
  assert.ok(!actions.includes(AUDIT_ACTIONS.FINAL_SIGN_OFF));
  assert.ok(actions.includes(AUDIT_ACTIONS.MENTOR_EVALUATION_SUBMITTED));
});

test("missing createdAt and JSON data fall back safely", () => {
  const fallbackTime = new Date("2026-02-01T00:00:00.000Z");
  const entries = buildBackfillEntries(
    makeAppointment({ status: "ExpectationSet", createdAt: null, expectationData: null, mentorEvaluationData: null }),
    makeContext({ gaName: null, fallbackTime }),
  );

  assert.equal(entries.length, 2);
  assert.ok(entries.every((entry) => entry.createdAt.getTime() === fallbackTime.getTime()));
  assert.equal(entries[1].description, "Set expectations for graduate assistant" + BACKFILL_DESCRIPTION_SUFFIX);
});

test("missing createdAt with no fallback time uses the current time", () => {
  const before = Date.now();
  const [entry] = buildBackfillEntries(makeAppointment({ createdAt: null }), makeContext());
  assert.ok(entry.createdAt.getTime() >= before);
});

test("filterExistingEntries drops appointment/action pairs already logged", () => {
  const entries = buildBackfillEntries(makeAppointment({ status: "ExpectationSet" }), makeContext());
  const remaining = filterExistingEntries(entries, [
    { appointmentId: "appt-1", action: AUDIT_ACTIONS.APPOINTMENT_CREATED },
    { appointmentId: "other", action: AUDIT_ACTIONS.EXPECTATIONS_SET },
    { appointmentId: null, action: AUDIT_ACTIONS.EXPECTATIONS_SET },
  ]);

  assert.deepEqual(
    remaining.map((entry) => entry.action),
    [AUDIT_ACTIONS.EXPECTATIONS_SET],
  );
});

test("pickFallbackAdminId prefers an admin in the same unit", () => {
  const admins = [
    { id: "admin-a", unitId: "UNIT-A" },
    { id: "admin-b", unitId: "UNIT-B" },
  ];
  assert.equal(pickFallbackAdminId(admins, "UNIT-B"), "admin-b");
  assert.equal(pickFallbackAdminId(admins, "UNIT-Z"), "admin-a");
  assert.equal(pickFallbackAdminId([], "UNIT-A"), null);
});
