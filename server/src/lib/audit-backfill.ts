import { inArray } from "drizzle-orm";

import { db } from "../db/index.js";
import { appointments, auditLogs, users } from "../db/schema.js";
import {
  buildBackfillEntries,
  filterExistingEntries,
  pickFallbackAdminId,
} from "./audit-backfill.logic.js";

export type AuditBackfillResult = {
  appointmentsScanned: number;
  entriesInserted: number;
};

// Safe to run more than once: an appointment/action pair that is already
// logged is never inserted again.
export async function runAuditBackfill(): Promise<AuditBackfillResult> {
  const allAppointments = await db.select().from(appointments);
  if (allAppointments.length === 0) {
    return { appointmentsScanned: 0, entriesInserted: 0 };
  }

  const allUsers = await db
    .select({ id: users.id, fullName: users.fullName, role: users.role, unitId: users.unitId })
    .from(users);

  const nameById = new Map(allUsers.map((user) => [user.id, user.fullName]));
  const idByName = new Map(allUsers.map((user) => [user.fullName.trim().toLowerCase(), user.id]));
  const admins = allUsers.filter((user) => user.role === "Admin");

  const existing = await db
    .select({ appointmentId: auditLogs.appointmentId, action: auditLogs.action })
    .from(auditLogs)
    .where(inArray(auditLogs.appointmentId, allAppointments.map((appointment) => appointment.id)));

  const entries = allAppointments.flatMap((appointment) =>
    buildBackfillEntries(appointment, {
      gaName: nameById.get(appointment.gaId) ?? null,
      findUserIdByName: (name) => idByName.get(name.trim().toLowerCase()) ?? null,
      fallbackAdminId: pickFallbackAdminId(admins, appointment.unitId),
    }),
  );

  const toInsert = filterExistingEntries(entries, existing);
  if (toInsert.length > 0) {
    await db.insert(auditLogs).values(toInsert);
  }

  return { appointmentsScanned: allAppointments.length, entriesInserted: toInsert.length };
}
