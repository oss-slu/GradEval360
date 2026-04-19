import assert from "node:assert/strict";
import test from "node:test";

import {
  getActionLabelForRole,
  getAppointmentDateInfo,
  getAppointmentId,
  getAppointmentTitle,
  getStatusClasses,
  getStatusDisplay,
} from "../../src/pages/appointments.logic.js";
import { makeClientAppointment } from "../helpers/appointments.ts";

test("getAppointmentDateInfo prefers final meeting dates over expectation dates", () => {
  const result = getAppointmentDateInfo(
    makeClientAppointment({
      mentorEvaluationData: { finalMeetingDate: "2026-04-18" },
      expectationData: { expectationsMeetingDate: "2026-04-01" },
    }),
  );

  assert.equal(result.label, "Final meeting date");
});

test("getAppointmentDateInfo falls back to scheduled time text", () => {
  const result = getAppointmentDateInfo(
    makeClientAppointment({
      time: "2:00 PM",
      expectationData: {},
      mentorEvaluationData: {},
    }),
  );
  assert.deepEqual(result, { label: "Scheduled", value: "Time: 2:00 PM" });
});

test("getAppointmentTitle and getAppointmentId use sensible fallbacks", () => {
  assert.equal(getAppointmentTitle({ subject: "Quarterly Review" }, 0), "Quarterly Review");
  assert.equal(getAppointmentTitle({}, 1), "Appointment 2");
  assert.equal(getAppointmentId({ appointmentId: "appt-2" }, 0), "appt-2");
  assert.equal(getAppointmentId({}, 3), 3);
});

test("getStatusClasses returns the expected color families", () => {
  assert.equal(getStatusClasses("AwaitingSignOff"), "bg-yellow-100 text-yellow-800 border-yellow-200");
  assert.equal(getStatusClasses("FinalEvaluated"), "bg-green-100 text-green-800 border-green-200");
  assert.equal(getStatusClasses("Cancelled"), "bg-red-100 text-red-800 border-red-200");
});

test("getActionLabelForRole and getStatusDisplay stay role-aware", () => {
  assert.equal(getActionLabelForRole("ExpectationSet", "GA"), "Acknowledge expectations");
  assert.equal(getActionLabelForRole("ExpectationSet", "Mentor"), null);
  assert.equal(getStatusDisplay("MentorEvaluationCompleted"), "Mentor Evaluation Completed");
  assert.equal(getStatusDisplay(undefined), "Unknown");
});
