import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGaRoster,
  canViewGaRoster,
  isOpenStatus,
  type GaAppointmentRow,
  type GaUnitRow,
} from "../../src/routes/ga-roster.logic.js";

const gaA = { gaId: "ga-a", gaName: "GA A", gaEmail: "gaA@slu.edu" };
const gaB = { gaId: "ga-b", gaName: "GA B", gaEmail: "gaB@slu.edu" };

function appointment(overrides: Partial<GaAppointmentRow>): GaAppointmentRow {
  return {
    ...gaA,
    mentorName: "Mentor A",
    unitId: "UNIT-A",
    status: "AwaitingSelfEvaluation",
    ...overrides,
  };
}

test("canViewGaRoster only allows admins", () => {
  assert.equal(canViewGaRoster({ role: "Admin" }), true);
  assert.equal(canViewGaRoster({ role: "Mentor" }), false);
  assert.equal(canViewGaRoster({ role: "GA" }), false);
  assert.equal(canViewGaRoster(null), false);
  assert.equal(canViewGaRoster(undefined), false);
});

test("isOpenStatus treats every status except FinalEvaluated as open", () => {
  assert.equal(isOpenStatus("AwaitingExpectationSetting"), true);
  assert.equal(isOpenStatus("AwaitingSignOff"), true);
  assert.equal(isOpenStatus("FinalEvaluated"), false);
});

test("buildGaRoster returns an empty list with no data", () => {
  assert.deepEqual(buildGaRoster([], []), []);
});

test("buildGaRoster keeps GAs without appointments", () => {
  const units: GaUnitRow[] = [{ ...gaB, unitId: "UNIT-B" }, { ...gaB, unitId: null }];
  assert.deepEqual(buildGaRoster(units, []), [
    { ...gaB, units: ["UNIT-B"], mentors: [], openAppointments: 0, totalAppointments: 0 },
  ]);
});

test("buildGaRoster merges units, mentors and counts per GA", () => {
  const units: GaUnitRow[] = [
    { ...gaA, unitId: "UNIT-B" },
    { ...gaA, unitId: "UNIT-A" },
  ];
  const appointments = [
    appointment({ mentorName: "Mentor B", unitId: "UNIT-B" }),
    appointment({ mentorName: "Mentor A" }),
    appointment({ mentorName: "Mentor A", status: "FinalEvaluated" }),
    appointment({ mentorName: "Old Mentor", status: "FinalEvaluated", unitId: "UNIT-C" }),
    appointment({ mentorName: "  " }),
    appointment({ mentorName: null, status: "FinalEvaluated" }),
  ];

  const [entry] = buildGaRoster(units, appointments);

  assert.deepEqual(entry.units, ["UNIT-A", "UNIT-B", "UNIT-C"]);
  assert.deepEqual(entry.mentors, ["Mentor A", "Mentor B", "Old Mentor"]);
  assert.equal(entry.openAppointments, 3);
  assert.equal(entry.totalAppointments, 6);
});

test("buildGaRoster includes GAs found only through appointments and sorts by name", () => {
  const roster = buildGaRoster(
    [{ ...gaB, unitId: "UNIT-A" }],
    [appointment({ status: "FinalEvaluated" })],
  );

  assert.deepEqual(
    roster.map((entry) => [entry.gaName, entry.openAppointments, entry.mentors]),
    [
      ["GA A", 0, ["Mentor A"]],
      ["GA B", 0, []],
    ],
  );
});

test("buildGaRoster breaks name ties by email", () => {
  const roster = buildGaRoster(
    [
      { gaId: "2", gaName: "Sam", gaEmail: "z@slu.edu", unitId: null },
      { gaId: "1", gaName: "Sam", gaEmail: "a@slu.edu", unitId: null },
    ],
    [],
  );
  assert.deepEqual(roster.map((entry) => entry.gaEmail), ["a@slu.edu", "z@slu.edu"]);
});
