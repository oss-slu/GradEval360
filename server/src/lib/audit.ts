import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { auditLogs, users } from "../db/schema.js";
import type { RequestUser } from "../routes/appointments.logic.js";
import { buildAuditDescription, type AuditAction } from "../routes/audit-logs.logic.js";

type RecordAuditLogInput = {
  actor: Pick<RequestUser, "id" | "role">;
  action: AuditAction;
  appointmentId: string;
  gaId?: string | null;
};

export async function recordAuditLog({ actor, action, appointmentId, gaId }: RecordAuditLogInput) {
  try {
    let gaName: string | null = null;

    if (gaId) {
      const [ga] = await db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, gaId))
        .limit(1);
      gaName = ga?.fullName ?? null;
    }

    await db.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action,
      description: buildAuditDescription(action, gaName),
      appointmentId,
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
  }
}
