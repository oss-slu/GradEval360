export type AppointmentDetails = {
  id: string;
  appointmentCode?: string;
  status?: string;
  title?: string;
  subject?: string;
  name?: string;
  startsAt?: string;
  startTime?: string;
  scheduledAt?: string;
  starts_at?: string;
  start_time?: string;
  scheduled_at?: string;
  date?: string;
  time?: string;
  unitId?: string;
  gaName?: string;
  mentorName?: string;
  expectationData?: {
    goals?: string[];
    mentorGoals?: string[];
    gaGoals?: string[];
    weeklyHours?: number;
    responsibilities?: string;
    jobCategory?: string;
    expectedOutputs?: string;
    expectationsMeetingDate?: string;
    mentorNotes?: string;
    mentorAcknowledged?: boolean;
    mentorAcknowledgedAt?: string;
    gaAcknowledged?: boolean;
    gaAcknowledgedAt?: string;
  };
  selfEvaluationData?: {
    goalProgress?: string;
    strengths?: string;
    challenges?: string;
    additionalComments?: string;
  };
  mentorEvaluationData?: {
    ratings?: Record<string, number>;
    narrative?: string;
    overallSummary?: string;
    finalMeetingDate?: string;
    evaluationSubmittedAt?: string;
    evaluationSubmittedBy?: string;
    signOffDecision?: string;
    signOffNotes?: string;
    signOffPreparedAt?: string;
    signOffPreparedBy?: string;
    finalAcknowledged?: boolean;
    finalAcknowledgedAt?: string;
    finalAcknowledgedBy?: string;
  };
};

export const STATUS_COPY: Record<
  string,
  {
    label: string;
    owner: string;
    helper: string;
  }
> = {
  AwaitingExpectationSetting: {
    label: "Awaiting expectation setting",
    owner: "Mentor",
    helper: "Mentor should define the work plan, goals, and meeting details.",
  },
  ExpectationSet: {
    label: "Expectation set",
    owner: "GA",
    helper: "GA should review the plan and acknowledge expectations.",
  },
  AwaitingSelfEvaluation: {
    label: "Awaiting self-evaluation",
    owner: "GA",
    helper: "GA reflection is the next required action.",
  },
  SelfEvaluationCompleted: {
    label: "Self-evaluation completed",
    owner: "Mentor",
    helper: "Mentor should review the GA reflection and submit the mentor evaluation next.",
  },
  MentorEvaluationCompleted: {
    label: "Mentor evaluation completed",
    owner: "Admin",
    helper: "Admin should prepare final sign-off and review completion.",
  },
  AwaitingSignOff: {
    label: "Awaiting sign-off",
    owner: "Admin",
    helper: "Admin can finalize the evaluation cycle from this page.",
  },
  FinalEvaluated: {
    label: "Final evaluated",
    owner: "Complete",
    helper: "All Milestone 2 evaluation steps are complete.",
  },
};

export function formatTimestamp(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function formatDateTime(appointment: AppointmentDetails) {
  const finalMeetingDate = appointment.mentorEvaluationData?.finalMeetingDate;
  if (finalMeetingDate) {
    return {
      label: "Final meeting date",
      value: formatTimestamp(finalMeetingDate) ?? finalMeetingDate,
    };
  }

  const expectationsMeetingDate = appointment.expectationData?.expectationsMeetingDate;
  if (expectationsMeetingDate) {
    return {
      label: "Expectations meeting date",
      value: formatTimestamp(expectationsMeetingDate) ?? expectationsMeetingDate,
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

  const parsed = new Date(rawDateTime);

  if (Number.isNaN(parsed.getTime())) {
    return {
      label: "Scheduled",
      value: appointment.time ? `${rawDateTime} at ${appointment.time}` : rawDateTime,
    };
  }

  return {
    label: "Scheduled",
    value: appointment.time ? `${parsed.toLocaleString()} at ${appointment.time}` : parsed.toLocaleString(),
  };
}

export function getAppointmentTitle(appointment: AppointmentDetails) {
  return appointment.title || appointment.subject || appointment.name || "Appointment";
}

export function deriveGoalSections(appointment: AppointmentDetails | null) {
  const expectationGoals = appointment?.expectationData?.goals ?? [];
  const explicitMentorGoals = appointment?.expectationData?.mentorGoals;
  const mentorGoals =
    Array.isArray(explicitMentorGoals) && explicitMentorGoals.length > 0
      ? explicitMentorGoals
      : !appointment?.expectationData?.gaAcknowledged
        ? expectationGoals
        : [];
  const explicitGaGoals = appointment?.expectationData?.gaGoals;
  const gaGoals = Array.isArray(explicitGaGoals) && explicitGaGoals.length > 0 ? explicitGaGoals : [];

  const hasLegacyCombinedGoals =
    expectationGoals.length > 0 &&
    Boolean(appointment?.expectationData?.gaAcknowledged) &&
    mentorGoals.length === 0 &&
    gaGoals.length === 0;

  return {
    expectationGoals,
    mentorGoals,
    gaGoals,
    hasLegacyCombinedGoals,
  };
}

export function getAvailableActions(
  userRole: string | null,
  status: string | undefined,
) {
  return {
    canSetExpectations: userRole === "Mentor" && status === "AwaitingExpectationSetting",
    canAcknowledgeExpectations: userRole === "GA" && status === "ExpectationSet",
    canSubmitSelfEval: userRole === "GA" && status === "AwaitingSelfEvaluation",
    canSubmitMentorEval: userRole === "Mentor" && status === "SelfEvaluationCompleted",
    canCompleteSignOff:
      userRole === "Admin" &&
      (status === "MentorEvaluationCompleted" || status === "AwaitingSignOff"),
  };
}
