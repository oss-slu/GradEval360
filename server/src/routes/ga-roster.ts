import { Router } from 'express';
import { and, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import { appointments, userUnits, users } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import type { RequestUser } from './appointments.logic.js';
import { getAuditUnitScope } from './audit-logs.logic.js';
import { buildGaRoster, canViewGaRoster } from './ga-roster.logic.js';

const router = Router();

const mentors = alias(users, 'mentor');

router.get('/', requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;

    if (!canViewGaRoster(user)) {
      return res
        .status(403)
        .json({ error: 'Only admins can view the GA roster' });
    }

    const unitScope = getAuditUnitScope(user);

    const gaUnitRows = await db
      .select({
        gaId: users.id,
        gaName: users.fullName,
        gaEmail: users.email,
        unitId: userUnits.unitId,
      })
      .from(users)
      .leftJoin(userUnits, eq(userUnits.userId, users.id))
      .where(
        and(
          eq(users.role, 'GA'),
          unitScope ? inArray(userUnits.unitId, unitScope) : undefined
        )
      );

    const appointmentRows = await db
      .select({
        gaId: users.id,
        gaName: users.fullName,
        gaEmail: users.email,
        mentorName: mentors.fullName,
        unitId: appointments.unitId,
        status: appointments.status,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.gaId, users.id))
      .leftJoin(mentors, eq(appointments.mentorId, mentors.id))
      .where(unitScope ? inArray(appointments.unitId, unitScope) : undefined);

    return res.json({ gas: buildGaRoster(gaUnitRows, appointmentRows) });
  } catch (error) {
    console.error('Error fetching GA roster:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
