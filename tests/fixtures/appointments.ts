export function makeAppointmentRecord(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "appt-1",
    appointmentCode: "GEA-20260418-AAA111",
    status: "AwaitingExpectationSetting",
    gaId: "ga-1",
    mentorId: "mentor-1",
    unitId: "UNIT-A",
    ...overrides,
  };
}

export function makeClientAppointment(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "appt-1",
    appointmentCode: "GEA-20260418-AAA111",
    subject: "Quarterly Review",
    status: "AwaitingExpectationSetting",
    time: "2:00 PM",
    expectationData: {
      expectationsMeetingDate: "2026-04-18",
    },
    mentorEvaluationData: {
      finalMeetingDate: "2026-04-20",
    },
    ...overrides,
  };
}
