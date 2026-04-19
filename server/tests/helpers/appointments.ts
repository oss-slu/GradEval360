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
