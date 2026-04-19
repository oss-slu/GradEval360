import assert from "node:assert/strict";
import test from "node:test";

import { buildStatusCards, getPendingHeading, getStatusLabel } from "../../src/pages/dashboard.logic.js";

test("getStatusLabel falls back to the raw status when needed", () => {
  assert.equal(getStatusLabel("AwaitingSignOff"), "Awaiting Sign-Off");
  assert.equal(getStatusLabel("CustomStatus"), "CustomStatus");
});

test("getPendingHeading matches the signed-in role", () => {
  assert.equal(getPendingHeading("GA"), "My pending items");
  assert.equal(getPendingHeading("Mentor"), "Mentor follow-up queue");
  assert.equal(getPendingHeading("Admin"), "Admin completion queue");
  assert.equal(getPendingHeading(null), "Pending items");
});

test("buildStatusCards sorts populated statuses by descending count", () => {
  const cards = buildStatusCards({
    totalAppointments: 4,
    completedAppointments: 1,
    inProgressAppointments: 3,
    completionPercentage: 25,
    statusCounts: {
      AwaitingExpectationSetting: 1,
      ExpectationSet: 0,
      AwaitingSelfEvaluation: 2,
      SelfEvaluationCompleted: 1,
      MentorEvaluationCompleted: 0,
      AwaitingSignOff: 0,
      FinalEvaluated: 0,
    },
    pendingItems: [],
  });

  assert.deepEqual(cards.map((card) => card.status), [
    "AwaitingSelfEvaluation",
    "AwaitingExpectationSetting",
    "SelfEvaluationCompleted",
  ]);
});
