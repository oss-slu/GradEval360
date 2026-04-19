import { APPOINTMENT_STATUS } from "../../../shared/schemas/appointment.js";
import type {
  FinalAcknowledgmentInput,
  FinalSignOffPreparationInput,
  GAAcknowledgeExpectationsInput,
  MentorEvaluationInput,
  MentorExpectationSettingInput,
} from "../../../shared/schemas/appointment.js";

export type RequestUser = {
  id: string;
  role: "GA" | "Mentor" | "Admin";
  unitId?: string | null;
  unitIds?: string[];
  name?: string | null;
  fullName?: string | null;
};

export type AppointmentExpectationDraft = {
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

export type AppointmentExpectationData = AppointmentExpectationDraft & {
  goals: string[];
};

export type AppointmentMentorEvaluationData = {
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

export type AppointmentRecord = {
  id: string;
  status: string;
  gaId: string;
  mentorId: string;
  unitId: string;
  appointmentCode?: string | null;
};

export function getActorName(user: RequestUser) {
  return user.fullName ?? user.name ?? user.id;
}

export function canAccessAppointment(user: RequestUser, appointment: AppointmentRecord) {
  if (user.role === "GA") {
    return appointment.gaId === user.id;
  }

  if (user.role === "Mentor") {
    return appointment.mentorId === user.id;
  }

  if (user.role === "Admin") {
    const allowedUnits = Array.isArray(user.unitIds) ? user.unitIds : [];
    if (allowedUnits.length > 0) {
      return allowedUnits.includes(appointment.unitId);
    }

    if (user.unitId) {
      return appointment.unitId === user.unitId;
    }

    return true;
  }

  return false;
}

export function buildAppointmentSummary(records: AppointmentRecord[]) {
  const statusCounts = Object.values(APPOINTMENT_STATUS).reduce<Record<string, number>>(
    (accumulator, status) => {
      accumulator[status] = 0;
      return accumulator;
    },
    {},
  );

  for (const appointment of records) {
    statusCounts[appointment.status] = (statusCounts[appointment.status] ?? 0) + 1;
  }

  const totalAppointments = records.length;
  const completedAppointments = records.filter(
    (appointment) => appointment.status === APPOINTMENT_STATUS.FINAL,
  ).length;
  const inProgressAppointments = totalAppointments - completedAppointments;

  return {
    totalAppointments,
    completedAppointments,
    inProgressAppointments,
    completionPercentage:
      totalAppointments === 0 ? 0 : Math.round((completedAppointments / totalAppointments) * 100),
    statusCounts,
    pendingItems: records
      .filter((appointment) => appointment.status !== APPOINTMENT_STATUS.FINAL)
      .map((appointment) => ({
        id: appointment.id,
        appointmentCode: appointment.appointmentCode,
        status: appointment.status,
        gaId: appointment.gaId,
        mentorId: appointment.mentorId,
        unitId: appointment.unitId,
      })),
  };
}

export function buildMentorExpectationUpdate(
  existingExpectationData: AppointmentExpectationDraft,
  input: MentorExpectationSettingInput,
  acknowledgedAt: string,
): AppointmentExpectationData {
  return {
    ...existingExpectationData,
    ...input,
    goals: input.goals,
    mentorGoals: input.goals,
    mentorAcknowledged: true,
    mentorAcknowledgedAt: acknowledgedAt,
  };
}

export function buildGAAcknowledgmentUpdate(
  existingExpectationData: AppointmentExpectationDraft,
  input: GAAcknowledgeExpectationsInput,
  acknowledgedAt: string,
): AppointmentExpectationData {
  const existingGoals = Array.isArray(existingExpectationData.goals)
    ? existingExpectationData.goals
    : [];
  const existingMentorGoals = Array.isArray(existingExpectationData.mentorGoals)
    ? existingExpectationData.mentorGoals
    : existingGoals;

  return {
    ...existingExpectationData,
    goals: [...existingMentorGoals, ...input.goals],
    mentorGoals: existingMentorGoals,
    gaGoals: input.goals,
    gaAcknowledged: true,
    gaAcknowledgedAt: acknowledgedAt,
  };
}

export function buildMentorEvaluationUpdate(
  existingMentorEvaluationData: AppointmentMentorEvaluationData,
  input: MentorEvaluationInput,
  actorName: string,
  submittedAt: string,
): AppointmentMentorEvaluationData {
  return {
    ...existingMentorEvaluationData,
    ...input,
    evaluationSubmittedAt: submittedAt,
    evaluationSubmittedBy: actorName,
  };
}

export function buildFinalSignOffPreparationUpdate(
  existingMentorEvaluationData: AppointmentMentorEvaluationData,
  input: FinalSignOffPreparationInput,
  actorName: string,
  preparedAt: string,
): AppointmentMentorEvaluationData {
  return {
    ...existingMentorEvaluationData,
    signOffDecision: input.signOffDecision,
    signOffNotes: input.signOffNotes,
    signOffPreparedAt: preparedAt,
    signOffPreparedBy: actorName,
  };
}

export function buildFinalAcknowledgmentUpdate(
  existingMentorEvaluationData: AppointmentMentorEvaluationData,
  input: FinalAcknowledgmentInput,
  actorName: string,
  acknowledgedAt: string,
): AppointmentMentorEvaluationData {
  return {
    ...existingMentorEvaluationData,
    finalAcknowledged: input.finalAcknowledged,
    finalAcknowledgedAt: acknowledgedAt,
    finalAcknowledgedBy: actorName,
  };
}
