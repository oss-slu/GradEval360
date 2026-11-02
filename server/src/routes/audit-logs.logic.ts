import type { RequestUser } from "./appointments.logic.js";

export const AUDIT_ACTIONS = {
  APPOINTMENT_CREATED: "AppointmentCreated",
  EXPECTATIONS_SET: "ExpectationsSet",
  EXPECTATIONS_ACKNOWLEDGED: "ExpectationsAcknowledged",
  SELF_EVALUATION_SUBMITTED: "SelfEvaluationSubmitted",
  MENTOR_EVALUATION_SUBMITTED: "MentorEvaluationSubmitted",
  SIGN_OFF_PREPARED: "SignOffPrepared",
  FINAL_SIGN_OFF: "FinalSignOff",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_DATE_RANGES = ["all", "today", "7d", "30d", "90d"] as const;
export type AuditDateRange = (typeof AUDIT_DATE_RANGES)[number];

export const DEFAULT_AUDIT_LIMIT = 200;
export const MAX_AUDIT_LIMIT = 500;

export type AuditLogQuery = {
  search: string | null;
  actorId: string | null;
  range: AuditDateRange;
  limit: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstString(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseAuditLogQuery(query: Record<string, unknown>): AuditLogQuery {
  const search = firstString(query.search);
  const actorIdRaw = firstString(query.actorId);
  const rangeRaw = firstString(query.range);
  const limitRaw = Number(firstString(query.limit));

  const range = AUDIT_DATE_RANGES.includes(rangeRaw as AuditDateRange)
    ? (rangeRaw as AuditDateRange)
    : "all";

  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, MAX_AUDIT_LIMIT)
      : DEFAULT_AUDIT_LIMIT;

  return {
    search: search ? search.slice(0, 100) : null,
    actorId: actorIdRaw && UUID_PATTERN.test(actorIdRaw) ? actorIdRaw : null,
    range,
    limit,
  };
}

export function getRangeStart(range: AuditDateRange, now: Date = new Date()): Date | null {
  if (range === "all") return null;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const daysBack: Record<Exclude<AuditDateRange, "all">, number> = {
    today: 0,
    "7d": 6,
    "30d": 29,
    "90d": 89,
  };

  start.setDate(start.getDate() - daysBack[range]);
  return start;
}

export function toLikePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function getAuditUnitScope(user: RequestUser): string[] | null {
  if (Array.isArray(user.unitIds) && user.unitIds.length > 0) return user.unitIds;
  if (user.unitId) return [user.unitId];
  return null;
}

export function canViewAuditLogs(user: Pick<RequestUser, "role"> | null | undefined): boolean {
  return user?.role === "Admin";
}

export function buildAuditDescription(action: AuditAction, gaName?: string | null): string {
  const subject = gaName?.trim() || "graduate assistant";

  switch (action) {
    case AUDIT_ACTIONS.APPOINTMENT_CREATED:
      return `Created appointment for ${subject}`;
    case AUDIT_ACTIONS.EXPECTATIONS_SET:
      return `Set expectations for ${subject}`;
    case AUDIT_ACTIONS.EXPECTATIONS_ACKNOWLEDGED:
      return "Acknowledged expectations";
    case AUDIT_ACTIONS.SELF_EVALUATION_SUBMITTED:
      return "Submitted self-evaluation";
    case AUDIT_ACTIONS.MENTOR_EVALUATION_SUBMITTED:
      return `Submitted evaluation for ${subject}`;
    case AUDIT_ACTIONS.SIGN_OFF_PREPARED:
      return `Prepared sign-off for ${subject}`;
    case AUDIT_ACTIONS.FINAL_SIGN_OFF:
      return `Finalized sign-off for ${subject}`;
    default:
      return String(action);
  }
}
