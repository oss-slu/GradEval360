import { APPOINTMENT_STATUS } from "../../../shared/schemas/appointment.js";
import { AUDIT_ACTIONS, buildAuditDescription, type AuditAction } from "../routes/audit-logs.logic.js";

// Rebuilds audit history for appointments that existed before audit logging
// (or were seeded). Pure: the caller loads the data and writes the results.

export const BACKFILL_DESCRIPTION_SUFFIX = " (reconstructed)";

const STATUS_ORDER: string[] = [
  APPOINTMENT_STATUS.AWAITING,
  APPOINTMENT_STATUS.SET,
  APPOINTMENT_STATUS.AWAITING_MENTOR_FINALIZATION,
  APPOINTMENT_STATUS.AWAITING_SELF_EVAL,
  APPOINTMENT_STATUS.SELF_EVAL_DONE,
  APPOINTMENT_STATUS.MENTOR_EVAL_DONE,
  APPOINTMENT_STATUS.AWAITING_SIGN_OFF,
  APPOINTMENT_STATUS.FINAL,
];

export type BackfillRole = "GA" | "Mentor" | "Admin";

export type BackfillAppointment = {
  id: string;
  gaId: string;
  mentorId: string;
  status: string;
  createdAt: Date | string | null;
  expectationData?: object | null;
  mentorEvaluationData?: object | null;
};

export type BackfillContext = {
  gaName?: string | null;
  // Sign-off steps store the admin's name, not an id.
  findUserIdByName: (name: string) => string | null;
  // Used when the stored admin name can't be matched to a user.
  fallbackAdminId: string | null;
  fallbackTime?: Date;
};

export type BackfillEntry = {
  actorId: string;
  actorRole: BackfillRole;
  action: AuditAction;
  description: string;
  appointmentId: string;
  createdAt: Date;
};

export function hasReachedStatus(current: string, target: string): boolean {
  const currentIndex = STATUS_ORDER.indexOf(current);
  const targetIndex = STATUS_ORDER.indexOf(target);
  if (currentIndex === -1 || targetIndex === -1) return false;
  return currentIndex >= targetIndex;
}

export function parseTimestamp(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readString(record: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

type Step = {
  action: AuditAction;
  reached: boolean;
  actor: { id: string; role: BackfillRole } | null;
  timestamp: unknown;
};

export function buildBackfillEntries(
  appointment: BackfillAppointment,
  context: BackfillContext,
): BackfillEntry[] {
  const expectation = (appointment.expectationData ?? {}) as Record<string, unknown>;
  const mentorEval = (appointment.mentorEvaluationData ?? {}) as Record<string, unknown>;
  const status = appointment.status;

  const mentor = { id: appointment.mentorId, role: "Mentor" as const };
  const ga = { id: appointment.gaId, role: "GA" as const };

  const resolveAdmin = (name: string | null) => {
    const id = (name ? context.findUserIdByName(name) : null) ?? context.fallbackAdminId;
    return id ? { id, role: "Admin" as const } : null;
  };

  const steps: Step[] = [
    {
      action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
      reached: true,
      actor: mentor,
      timestamp: appointment.createdAt,
    },
    {
      action: AUDIT_ACTIONS.EXPECTATIONS_SET,
      reached: hasReachedStatus(status, APPOINTMENT_STATUS.SET),
      actor: mentor,
      timestamp: expectation.mentorAcknowledgedAt,
    },
    {
      action: AUDIT_ACTIONS.EXPECTATIONS_ACKNOWLEDGED,
      reached: hasReachedStatus(status, APPOINTMENT_STATUS.AWAITING_MENTOR_FINALIZATION),
      actor: ga,
      timestamp: expectation.gaAcknowledgedAt,
    },
    {
      // Older appointments skipped this step, so only log it when it was recorded.
      action: AUDIT_ACTIONS.EXPECTATIONS_FINALIZED,
      reached:
        hasReachedStatus(status, APPOINTMENT_STATUS.AWAITING_SELF_EVAL) &&
        (expectation.mentorFinalized === true || parseTimestamp(expectation.mentorFinalizedAt) !== null),
      actor: mentor,
      timestamp: expectation.mentorFinalizedAt,
    },
    {
      // Self-evaluations don't store a submission time; falls back to the previous step.
      action: AUDIT_ACTIONS.SELF_EVALUATION_SUBMITTED,
      reached: hasReachedStatus(status, APPOINTMENT_STATUS.SELF_EVAL_DONE),
      actor: ga,
      timestamp: null,
    },
    {
      action: AUDIT_ACTIONS.MENTOR_EVALUATION_SUBMITTED,
      reached: hasReachedStatus(status, APPOINTMENT_STATUS.MENTOR_EVAL_DONE),
      actor: mentor,
      timestamp: mentorEval.evaluationSubmittedAt,
    },
    {
      action: AUDIT_ACTIONS.SIGN_OFF_PREPARED,
      reached: hasReachedStatus(status, APPOINTMENT_STATUS.AWAITING_SIGN_OFF),
      actor: resolveAdmin(readString(mentorEval, "signOffPreparedBy")),
      timestamp: mentorEval.signOffPreparedAt,
    },
    {
      action: AUDIT_ACTIONS.FINAL_SIGN_OFF,
      reached: hasReachedStatus(status, APPOINTMENT_STATUS.FINAL),
      actor: resolveAdmin(readString(mentorEval, "finalAcknowledgedBy")),
      timestamp: mentorEval.finalAcknowledgedAt,
    },
  ];

  const entries: BackfillEntry[] = [];
  // Keep entries in workflow order: a step never appears before the one it follows.
  let previous = parseTimestamp(appointment.createdAt) ?? context.fallbackTime ?? new Date();

  for (const step of steps) {
    if (!step.reached || !step.actor) continue;

    const parsed = parseTimestamp(step.timestamp);
    const createdAt = parsed && parsed >= previous ? parsed : previous;
    previous = createdAt;

    entries.push({
      actorId: step.actor.id,
      actorRole: step.actor.role,
      action: step.action,
      description: buildAuditDescription(step.action, context.gaName) + BACKFILL_DESCRIPTION_SUFFIX,
      appointmentId: appointment.id,
      createdAt,
    });
  }

  return entries;
}

export function filterExistingEntries(
  entries: BackfillEntry[],
  existing: Array<{ appointmentId: string | null; action: string }>,
): BackfillEntry[] {
  const seen = new Set(existing.map((row) => `${row.appointmentId}:${row.action}`));
  return entries.filter((entry) => !seen.has(`${entry.appointmentId}:${entry.action}`));
}

export function pickFallbackAdminId(
  admins: Array<{ id: string; unitId: string | null }>,
  unitId: string,
): string | null {
  return admins.find((admin) => admin.unitId === unitId)?.id ?? admins[0]?.id ?? null;
}
