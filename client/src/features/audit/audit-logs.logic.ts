export type AuditLogEntry = {
  id: string;
  createdAt: string;
  action: string;
  description: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  appointmentId: string | null;
  appointmentCode: string | null;
};

export type AuditActor = {
  id: string;
  fullName: string;
  role: string;
};

export type AuditLogResponse = {
  logs: AuditLogEntry[];
  actors: AuditActor[];
};

export type AuditFilters = {
  search: string;
  actorId: string;
  range: string;
};

export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

export function buildAuditLogsUrl(filters: AuditFilters): string {
  const params = new URLSearchParams();
  const search = filters.search.trim();

  if (search) params.set("search", search);
  if (filters.actorId && filters.actorId !== "all") params.set("actorId", filters.actorId);
  if (filters.range && filters.range !== "all") params.set("range", filters.range);

  const query = params.toString();
  return query ? `/api/audit-logs?${query}` : "/api/audit-logs";
}

export function formatAuditTimestamp(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const sameYear = date.getFullYear() === now.getFullYear();
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const timePart = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return `${datePart}, ${timePart}`;
}

export function getAppointmentLabel(entry: Pick<AuditLogEntry, "appointmentCode" | "appointmentId">): string {
  if (entry.appointmentCode) return entry.appointmentCode;
  if (entry.appointmentId) return entry.appointmentId.slice(0, 8);
  return "—";
}

export function getActorLabel(entry: Pick<AuditLogEntry, "actorName">): string {
  return entry.actorName?.trim() || "Unknown user";
}

export function getActorOptionLabel(actor: AuditActor): string {
  return `${actor.fullName} (${actor.role})`;
}

export function normalizeAuditResponse(data: unknown): AuditLogResponse {
  if (Array.isArray(data)) return { logs: data as AuditLogEntry[], actors: [] };

  const record = (data ?? {}) as Partial<AuditLogResponse>;
  return {
    logs: Array.isArray(record.logs) ? record.logs : [],
    actors: Array.isArray(record.actors) ? record.actors : [],
  };
}

export function getResultCountLabel(count: number, loading: boolean): string {
  if (loading) return "Loading...";
  return count === 1 ? "1 entry" : `${count} entries`;
}
