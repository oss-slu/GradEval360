import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_UNITS,
  filterGaRoster,
  formatList,
  getGaNameLabel,
  getRosterCountLabel,
  getUnitOptions,
  normalizeGaRosterResponse,
  type GaRosterEntry,
} from "../../src/features/ga-roster/ga-roster.logic.js";

const roster: GaRosterEntry[] = [
  {
    gaId: "1",
    gaName: "GA A",
    gaEmail: "gaA@slu.edu",
    units: ["UNIT-A", "UNIT-B"],
    mentors: ["Mentor A"],
    openAppointments: 2,
    totalAppointments: 3,
  },
  {
    gaId: "2",
    gaName: "GA B",
    gaEmail: "gaB@slu.edu",
    units: ["UNIT-B"],
    mentors: ["Bella Ott"],
    openAppointments: 0,
    totalAppointments: 0,
  },
];

test("normalizeGaRosterResponse reads the gas array and fills defaults", () => {
  assert.deepEqual(normalizeGaRosterResponse({ gas: [{ gaId: "x", openAppointments: "2" }] }), [
    {
      gaId: "x",
      gaName: "",
      gaEmail: "",
      units: [],
      mentors: [],
      openAppointments: 2,
      totalAppointments: 0,
    },
  ]);
  assert.equal(normalizeGaRosterResponse([null]).length, 1);
  assert.equal(normalizeGaRosterResponse([null])[0].gaId, "");
});

test("normalizeGaRosterResponse handles bad payloads", () => {
  assert.deepEqual(normalizeGaRosterResponse(null), []);
  assert.deepEqual(normalizeGaRosterResponse({ gas: "nope" }), []);
  assert.equal(normalizeGaRosterResponse(roster).length, 2);
});

test("filterGaRoster returns everything with no filters", () => {
  assert.equal(filterGaRoster(roster, { search: "  ", unit: ALL_UNITS }).length, 2);
  assert.equal(filterGaRoster(roster, { search: "", unit: "" }).length, 2);
});

test("filterGaRoster filters by unit", () => {
  assert.deepEqual(
    filterGaRoster(roster, { search: "", unit: "UNIT-A" }).map((entry) => entry.gaId),
    ["1"],
  );
});

test("filterGaRoster searches GA name, email and mentor", () => {
  const ids = (search: string) => filterGaRoster(roster, { search, unit: ALL_UNITS }).map((e) => e.gaId);
  assert.deepEqual(ids("ga a"), ["1"]);
  assert.deepEqual(ids("GAB@"), ["2"]);
  assert.deepEqual(ids("ott"), ["2"]);
  assert.deepEqual(ids("nobody"), []);
});

test("getUnitOptions lists unique units sorted", () => {
  assert.deepEqual(getUnitOptions(roster), ["UNIT-A", "UNIT-B"]);
});

test("formatList joins values or shows a dash", () => {
  assert.equal(formatList(["A", "B"]), "A, B");
  assert.equal(formatList([]), "—");
});

test("getGaNameLabel falls back to email, then a placeholder", () => {
  assert.equal(getGaNameLabel({ gaName: "GA A", gaEmail: "a@slu.edu" }), "GA A");
  assert.equal(getGaNameLabel({ gaName: " ", gaEmail: "a@slu.edu" }), "a@slu.edu");
  assert.equal(getGaNameLabel({ gaName: "", gaEmail: "" }), "Unknown GA");
});

test("getRosterCountLabel describes loading, totals and filtered counts", () => {
  assert.equal(getRosterCountLabel(0, 0, true), "Loading...");
  assert.equal(getRosterCountLabel(1, 1, false), "1 GA");
  assert.equal(getRosterCountLabel(4, 4, false), "4 GAs");
  assert.equal(getRosterCountLabel(1, 4, false), "1 of 4 GAs");
});
