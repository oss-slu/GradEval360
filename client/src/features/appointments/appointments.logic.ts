export type Appointment = {
  id?: string | number;
  appointmentCode?: string;
  appointmentId?: string | number;
  title?: string;
  name?: string;
  subject?: string;
  status?: string;
  date?: string;
  time?: string;
  starts_at?: string;
  start_time?: string;
  scheduled_at?: string;
  startsAt?: string;
  startTime?: string;
  scheduledAt?: string;
  mentorName?: string;
  gaName?: string;
  adminName?: string;
  unitId?: string;
  expectationData?: {
    expectationsMeetingDate?: string;
  };
  mentorEvaluationData?: {
    finalMeetingDate?: string;
  };
};

export const STATUS_METADATA: Record<
  string,
  {
    label: string;
    primaryActor: string;
    requiredAction: string;
  }
> = {
  AwaitingExpectationSetting: {
    label: "Awaiting Expectation Setting",
    primaryActor: "Mentor",
    requiredAction: "Confirm duties, expectations, goals, hours, and acknowledge the plan.",
  },
  ExpectationSet: {
    label: "Expectation Set",
    primaryActor: "GA",
    requiredAction: "Review mentor expectations and add 1 to 3 personal goals.",
  },
  AwaitingSelfEvaluation: {
    label: "Awaiting Self-Evaluation",
    primaryActor: "GA",
    requiredAction: "Submit self-evaluation with progress, strengths, and challenges.",
  },
  SelfEvaluationCompleted: {
    label: "Self-Evaluation Completed",
    primaryActor: "Mentor",
    requiredAction: "Review the GA reflection and submit mentor evaluation.",
  },
  MentorEvaluationCompleted: {
    label: "Mentor Evaluation Completed",
    primaryActor: "Admin",
    requiredAction: "Prepare sign-off notes and move the appointment to awaiting sign-off.",
  },
  AwaitingSignOff: {
    label: "Awaiting Sign-Off",
    primaryActor: "Admin",
    requiredAction: "Finalize the annual evaluation acknowledgment.",
  },
  FinalEvaluated: {
    label: "Final Evaluated",
    primaryActor: "Complete",
    requiredAction: "Cycle complete. No further action required.",
  },
};

export const STATUS_FLOW = Object.entries(STATUS_METADATA).map(([status, metadata]) => ({
  status,
  ...metadata,
}));

export function formatDisplayDate(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return isDateOnly ? parsed.toLocaleDateString() : parsed.toLocaleString();
}

export function getAppointmentDateInfo(appointment: Appointment) {
  const finalMeetingDate = appointment.mentorEvaluationData?.finalMeetingDate;
  if (finalMeetingDate) {
    return {
      label: "Final meeting date",
      value: formatDisplayDate(finalMeetingDate) ?? finalMeetingDate,
    };
  }

  const expectationsMeetingDate = appointment.expectationData?.expectationsMeetingDate;
  if (expectationsMeetingDate) {
    return {
      label: "Expectations meeting date",
      value: formatDisplayDate(expectationsMeetingDate) ?? expectationsMeetingDate,
    };
  }

  const rawDateTime =
    appointment.startsAt ??
    appointment.startTime ??
    appointment.scheduledAt ??
    appointment.starts_at ??
    appointment.start_time ??
    appointment.scheduled_at ??
    appointment.date;

  if (!rawDateTime) {
    return appointment.time
      ? { label: "Scheduled", value: `Time: ${appointment.time}` }
      : { label: "Meeting date", value: "Date not recorded yet" };
  }

  const formatted = formatDisplayDate(rawDateTime) ?? rawDateTime;
  return {
    label: "Scheduled",
    value: appointment.time ? `${formatted} at ${appointment.time}` : formatted,
  };
}

export function getAppointmentTitle(appointment: Appointment, index: number) {
  return appointment.title || appointment.subject || appointment.name || `Appointment ${index + 1}`;
}

export function getAppointmentId(appointment: Appointment, index: number) {
  return appointment.id ?? appointment.appointmentId ?? index;
}

export function getStatusClasses(status?: string) {
  const normalized = (status || "unknown").toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("confirmed") ||
    normalized.includes("complete") ||
    normalized.includes("final") ||
    normalized.includes("evaluated")
  ) {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("awaiting") ||
    normalized.includes("expectation")
  ) {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (normalized.includes("cancel")) {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-slate-100 text-slate-800 border-slate-200";
}

export function getActionLabelForRole(status: string, role: string | null) {
  if (!role) return null;

  if (role === "GA") {
    if (status === "ExpectationSet") return "Acknowledge expectations";
    if (status === "AwaitingSelfEvaluation") return "Complete self-evaluation";
  }

  if (role === "Mentor") {
    if (status === "AwaitingExpectationSetting") return "Set expectations";
    if (status === "SelfEvaluationCompleted") return "Complete mentor evaluation";
  }

  if (role === "Admin") {
    if (status === "MentorEvaluationCompleted") return "Prepare sign-off";
    if (status === "AwaitingSignOff") return "Finalize sign-off";
  }

  return null;
}

export function getStatusDisplay(status?: string) {
  return STATUS_METADATA[status || ""]?.label ?? status ?? "Unknown";
}
