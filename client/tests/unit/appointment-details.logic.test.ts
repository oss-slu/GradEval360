import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveGoalSections,
  formatDateTime,
  formatTimestamp,
  getAppointmentTitle,
  getAvailableActions,
} from "../../src/pages/appointment-details.logic.js";

test("formatTimestamp returns null for missing values and passes through invalid strings", () => {
  assert.equal(formatTimestamp(undefined), null);
  assert.equal(formatTimestamp("not-a-date"), "not-a-date");
});

test("formatDateTime prefers final meeting metadata and falls back to free-form time", () => {
  const finalMeeting = formatDateTime({
    id: "appt-1",
    mentorEvaluationData: { finalMeetingDate: "2026-04-18" },
  });
  const fallback = formatDateTime({
    id: "appt-2",
    time: "3:30 PM",
  });

  assert.equal(finalMeeting.label, "Final meeting date");
  assert.deepEqual(fallback, { label: "Scheduled", value: "Time: 3:30 PM" });
});

test("deriveGoalSections separates mentor and GA goals and detects legacy combined goals", () => {
  const modern = deriveGoalSections({
    id: "appt-1",
    expectationData: {
      goals: ["Mentor goal", "GA goal"],
      mentorGoals: ["Mentor goal"],
      gaGoals: ["GA goal"],
      gaAcknowledged: true,
    },
  });
  const legacy = deriveGoalSections({
    id: "appt-2",
    expectationData: {
      goals: ["Combined goal"],
      gaAcknowledged: true,
    },
  });

  assert.deepEqual(modern.mentorGoals, ["Mentor goal"]);
  assert.deepEqual(modern.gaGoals, ["GA goal"]);
  assert.equal(modern.hasLegacyCombinedGoals, false);
  assert.equal(legacy.hasLegacyCombinedGoals, true);
});

test("getAvailableActions exposes the correct action flags for each role", () => {
  assert.deepEqual(getAvailableActions("Mentor", "AwaitingExpectationSetting"), {
    canSetExpectations: true,
    canAcknowledgeExpectations: false,
    canSubmitSelfEval: false,
    canSubmitMentorEval: false,
    canCompleteSignOff: false,
  });

  assert.deepEqual(getAvailableActions("Admin", "AwaitingSignOff"), {
    canSetExpectations: false,
    canAcknowledgeExpectations: false,
    canSubmitSelfEval: false,
    canSubmitMentorEval: false,
    canCompleteSignOff: true,
  });
});

test("getAppointmentTitle falls back cleanly when no title fields exist", () => {
  assert.equal(getAppointmentTitle({ id: "appt-1", name: "Review Meeting" }), "Review Meeting");
  assert.equal(getAppointmentTitle({ id: "appt-2" }), "Appointment");
});
