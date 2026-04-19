import assert from "node:assert/strict";
import test from "node:test";

import { APPOINTMENT_STATUS } from "../../../shared/schemas/appointment.js";
import {
  buildAppointmentSummary,
  buildFinalAcknowledgmentUpdate,
  buildFinalSignOffPreparationUpdate,
  buildGAAcknowledgmentUpdate,
  buildMentorEvaluationUpdate,
  buildMentorExpectationUpdate,
  canAccessAppointment,
  getActorName,
  type AppointmentRecord,
} from "../../src/routes/appointments.logic.js";
import { makeAppointmentRecord } from "../helpers/appointments.ts";

test("buildAppointmentSummary reports totals, completion percentage, and pending items", () => {
  const appointments: AppointmentRecord[] = [
    makeAppointmentRecord({ status: APPOINTMENT_STATUS.AWAITING }) as AppointmentRecord,
    makeAppointmentRecord({
      id: "appt-2",
      appointmentCode: "GEA-20260418-BBB222",
      status: APPOINTMENT_STATUS.FINAL,
      gaId: "ga-2",
      mentorId: "mentor-2",
      unitId: "UNIT-B",
    }) as AppointmentRecord,
    makeAppointmentRecord({
      id: "appt-3",
      appointmentCode: "GEA-20260418-CCC333",
      status: APPOINTMENT_STATUS.MENTOR_EVAL_DONE,
      gaId: "ga-3",
      mentorId: "mentor-3",
    }) as AppointmentRecord,
  ];

  const summary = buildAppointmentSummary(appointments);

  assert.equal(summary.totalAppointments, 3);
  assert.equal(summary.completedAppointments, 1);
  assert.equal(summary.inProgressAppointments, 2);
  assert.equal(summary.completionPercentage, 33);
  assert.equal(summary.statusCounts[APPOINTMENT_STATUS.AWAITING], 1);
  assert.equal(summary.statusCounts[APPOINTMENT_STATUS.FINAL], 1);
  assert.equal(summary.pendingItems.length, 2);
});

test("canAccessAppointment respects GA, mentor, and admin scopes", () => {
  const appointment = makeAppointmentRecord({
    status: APPOINTMENT_STATUS.AWAITING,
  }) as AppointmentRecord;

  assert.equal(canAccessAppointment({ id: "ga-1", role: "GA" }, appointment), true);
  assert.equal(canAccessAppointment({ id: "ga-2", role: "GA" }, appointment), false);
  assert.equal(canAccessAppointment({ id: "mentor-1", role: "Mentor" }, appointment), true);
  assert.equal(
    canAccessAppointment({ id: "admin-1", role: "Admin", unitIds: ["UNIT-B"] }, appointment),
    false,
  );
  assert.equal(
    canAccessAppointment({ id: "admin-2", role: "Admin", unitIds: ["UNIT-A"] }, appointment),
    true,
  );
});

test("getActorName prefers fullName over name over id", () => {
  assert.equal(getActorName({ id: "user-1", role: "GA", fullName: "Mentor A", name: "A" }), "Mentor A");
  assert.equal(getActorName({ id: "user-2", role: "GA", name: "Fallback Name" }), "Fallback Name");
  assert.equal(getActorName({ id: "user-3", role: "GA" }), "user-3");
});

test("buildMentorExpectationUpdate preserves existing fields and stamps acknowledgment", () => {
  const result = buildMentorExpectationUpdate(
    { gaAcknowledged: false },
    {
      goals: ["Support grading"],
      responsibilities: "Support course grading and weekly office hours.",
      weeklyHours: 10,
      jobCategory: "Teaching",
      expectedOutputs: "Weekly grading and student support",
      expectationsMeetingDate: "2026-04-18",
      mentorNotes: "Keep communication frequent.",
    },
    "2026-04-18T10:00:00.000Z",
  );

  assert.deepEqual(result.mentorGoals, ["Support grading"]);
  assert.equal(result.mentorAcknowledged, true);
  assert.equal(result.mentorAcknowledgedAt, "2026-04-18T10:00:00.000Z");
  assert.equal(result.gaAcknowledged, false);
});

test("buildGAAcknowledgmentUpdate appends mentor and GA goals", () => {
  const result = buildGAAcknowledgmentUpdate(
    {
      goals: ["Support grading"],
      mentorGoals: ["Support grading"],
      responsibilities: "Support course grading and weekly office hours.",
    },
    { goals: ["Improve rubric feedback"] },
    "2026-04-18T11:00:00.000Z",
  );

  assert.deepEqual(result.goals, ["Support grading", "Improve rubric feedback"]);
  assert.deepEqual(result.gaGoals, ["Improve rubric feedback"]);
  assert.equal(result.gaAcknowledged, true);
  assert.equal(result.gaAcknowledgedAt, "2026-04-18T11:00:00.000Z");
});

test("buildMentorEvaluationUpdate stores actor and timestamp metadata", () => {
  const result = buildMentorEvaluationUpdate(
    { signOffDecision: "Pending" },
    {
      ratings: {
        communication: 5,
        dependability: 4,
        initiative: 5,
        qualityOfWork: 5,
      },
      narrative: "Consistently communicated clearly and delivered quality work.",
      overallSummary: "A strong contributor across the whole term.",
      finalMeetingDate: "2026-04-18",
    },
    "Mentor A",
    "2026-04-18T12:00:00.000Z",
  );

  assert.equal(result.evaluationSubmittedBy, "Mentor A");
  assert.equal(result.evaluationSubmittedAt, "2026-04-18T12:00:00.000Z");
  assert.equal(result.signOffDecision, "Pending");
});

test("buildFinalSignOffPreparationUpdate records admin preparation metadata", () => {
  const result = buildFinalSignOffPreparationUpdate(
    {},
    {
      signOffDecision: "Approve",
      signOffNotes: "All required milestones were completed successfully.",
    },
    "Admin A",
    "2026-04-18T13:00:00.000Z",
  );

  assert.equal(result.signOffPreparedBy, "Admin A");
  assert.equal(result.signOffPreparedAt, "2026-04-18T13:00:00.000Z");
  assert.equal(result.signOffDecision, "Approve");
});

test("buildFinalAcknowledgmentUpdate records final acknowledgment metadata", () => {
  const result = buildFinalAcknowledgmentUpdate(
    { signOffDecision: "Approve" },
    { finalAcknowledged: true },
    "Admin B",
    "2026-04-18T14:00:00.000Z",
  );

  assert.equal(result.finalAcknowledged, true);
  assert.equal(result.finalAcknowledgedAt, "2026-04-18T14:00:00.000Z");
  assert.equal(result.finalAcknowledgedBy, "Admin B");
  assert.equal(result.signOffDecision, "Approve");
});
