import { Router } from "express";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "../db/index.js";
import { appointments, auditLogs, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import type { RequestUser } from "./appointments.logic.js";
import {
  canViewAuditLogs,
  getAuditUnitScope,
  getRangeStart,
  parseAuditLogQuery,
  toLikePattern,
} from "./audit-logs.logic.js";

const router = Router();

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;

    if (!canViewAuditLogs(user)) {
      return res.status(403).json({ error: "Only admins can view audit logs" });
    }

    const filters = parseAuditLogQuery(req.query ?? {});
    const unitScope = getAuditUnitScope(user);

    const scopeCondition: SQL | undefined = unitScope
      ? inArray(appointments.unitId, unitScope)
      : undefined;

    const conditions: Array<SQL | undefined> = [scopeCondition];

    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }

    const rangeStart = getRangeStart(filters.range);
    if (rangeStart) {
      conditions.push(gte(auditLogs.createdAt, rangeStart));
    }

    if (filters.search) {
      const pattern = toLikePattern(filters.search);
      conditions.push(
        or(
          ilike(users.fullName, pattern),
          ilike(sql`${auditLogs.actorRole}::text`, pattern),
          ilike(auditLogs.description, pattern),
          ilike(auditLogs.action, pattern),
          ilike(appointments.appointmentCode, pattern),
        ),
      );
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        createdAt: auditLogs.createdAt,
        action: auditLogs.action,
        description: auditLogs.description,
        actorId: auditLogs.actorId,
        actorName: users.fullName,
        actorRole: auditLogs.actorRole,
        appointmentId: auditLogs.appointmentId,
        appointmentCode: appointments.appointmentCode,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.actorId, users.id))
      .leftJoin(appointments, eq(auditLogs.appointmentId, appointments.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.limit);

    const actors = await db
      .selectDistinct({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.actorId, users.id))
      .leftJoin(appointments, eq(auditLogs.appointmentId, appointments.id))
      .where(scopeCondition)
      .orderBy(asc(users.fullName));

    return res.json({ logs, actors });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
