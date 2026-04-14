import { Router } from "express";
import { db } from "../db/index.js";
import { appointments, users } from "../db/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js"; // adjust path if needed
import {
  APPOINTMENT_STATUS,
  GAAcknowledgeExpectationsSchema,
  MentorExpectationSettingSchema,
  SelfEvaluationSchema,
} from "../../../shared/schemas/appointment.js";
import { generateAppointmentCode } from "../lib/appointment-code.js";

const router = Router();
//removed: requireAuth

async function ensureAppointmentCodes(records: any[]) {
  const updates: Array<{ id: string; code: string }> = [];

  for (const appt of records) {
    if (!appt.appointmentCode) {
      updates.push({ id: appt.id, code: generateAppointmentCode() });
    }
  }

  if (!updates.length) return records;

  await Promise.all(
    updates.map(({ id, code }) =>
      db.update(appointments).set({ appointmentCode: code }).where(eq(appointments.id, id))
    )
  );

  return records.map((appt) => {
    const updated = updates.find((update) => update.id === appt.id);
    return updated ? { ...appt, appointmentCode: updated.code } : appt;
  });
}

async function enrichAppointments(records: any[]) {
  const safeResult = records ?? [];
  if (!safeResult.length) return safeResult;

  const userIds = Array.from(
    new Set(safeResult.flatMap((appt: any) => [appt.gaId, appt.mentorId].filter(Boolean)))
  );

  const userRows = await db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(userRows.map((row) => [row.id, row.fullName]));

  return safeResult.map((appt: any) => ({
    ...appt,
    gaName: userMap.get(appt.gaId) ?? null,
    mentorName: userMap.get(appt.mentorId) ?? null,
  }));
}

router.post("/:id/self-eval", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "GA") {
      return res.status(403).json({ error: "Only Graduate Assistants can submit self-evaluations" });
    }

    const parsed = SelfEvaluationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const [appointment] = await db
      .select({ status: appointments.status, gaId: appointments.gaId })
      .from(appointments)
      .where(eq(appointments.id, id));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.gaId !== user.id) {
      return res.status(403).json({ error: "You do not have access to this appointment" });
    }

    if (appointment.status !== APPOINTMENT_STATUS.AWAITING_SELF_EVAL) {
      return res.status(400).json({
        error: `Appointment must be in ${APPOINTMENT_STATUS.AWAITING_SELF_EVAL} status to submit self-evaluation`,
      });
    }

    await db
      .update(appointments)
      .set({
        selfEvaluationData: parsed.data,
        status: APPOINTMENT_STATUS.SELF_EVAL_DONE,
      })
      .where(eq(appointments.id, id));

    return res.json({ message: "Self-evaluation submitted successfully" });

  } catch (error) {
    console.error("Error submitting self-evaluation:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

//export default router; 

type AppointmentExpectationDraft = {
  goals?: string[];
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

type AppointmentExpectationData = AppointmentExpectationDraft & {
  goals: string[];
};

// Get api/appointments
//removed: requireAuth,
router.get("/", requireAuth, async (req: any, res) => {    
    try {
        
        const user = req.user;

        let result; 

        //GA - appointments
        if (user.role === "GA"){
            result = await db
                .select()
                .from(appointments)
                .where(eq(appointments.gaId, user.id));
        }

        //Mentor - Apointments they supervise
        else if (user.role === "Mentor") {
            result = await db
                .select()
                .from(appointments)
                .where(eq(appointments.mentorId, user.id));
        }

        //Admin - appointments 
        else if (user.role === "Admin") {
            if (Array.isArray(user.unitIds) && user.unitIds.length > 0) {
                result = await db
                    .select()
                    .from(appointments)
                    .where(inArray(appointments.unitId, user.unitIds));
            } else if (user.unitId) {
                result = await db
                    .select()
                    .from(appointments)
                    .where(eq(appointments.unitId, user.unitId));
            } else {
                result = await db
                    .select()
                    .from(appointments);
            }
        }

        //Those with an UNKNOWN ROLE
        else {
            return res.status(403).json({ error: "Forbidden" });
        }

        const withCodes = await ensureAppointmentCodes(result ?? []);
        const enriched = await enrichAppointments(withCodes);

        return res.json(enriched);
    } catch(error) {
        console.error("Error fetching appointments:", error);
        return res.status(500).json({ error: "Server error" });
    } 
});

router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;
    const appointmentId = req.params.id;

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (user.role === "GA" && appointment.gaId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (user.role === "Mentor" && appointment.mentorId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (user.role === "Admin") {
      const allowedUnits = Array.isArray(user.unitIds) ? user.unitIds : [];
      if (allowedUnits.length > 0 && !allowedUnits.includes(appointment.unitId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!allowedUnits.length && user.unitId && appointment.unitId !== user.unitId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const [withCode] = await ensureAppointmentCodes([appointment]);
    const [enriched] = await enrichAppointments([withCode]);

    return res.json(enriched);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/expectations/setup", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;
    const appointmentId = req.params.id;

    if (user.role !== "Mentor") {
      return res.status(403).json({ error: "Only mentors can set expectations" });
    }

    const parsed = MentorExpectationSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.mentorId, user.id)));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.status !== APPOINTMENT_STATUS.AWAITING) {
      return res.status(400).json({
        error: `Appointment must be in ${APPOINTMENT_STATUS.AWAITING} status to set expectations`,
      });
    }

    const existingExpectationData: AppointmentExpectationDraft =
      appointment.expectationData && typeof appointment.expectationData === "object"
        ? (appointment.expectationData as AppointmentExpectationDraft)
        : {};

    const updatedExpectationData: AppointmentExpectationDraft = {
      ...existingExpectationData,
      ...parsed.data,
      mentorAcknowledged: true,
      mentorAcknowledgedAt: new Date().toISOString(),
    };

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        expectationData: updatedExpectationData,
        status: APPOINTMENT_STATUS.SET,
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    return res.json(updatedAppointment);
  } catch (error) {
    console.error("Error setting expectations:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/appointments/:id/expectations
router.patch("/:id/expectations", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;
    const appointmentId = req.params.id;

    // Only GAs should be able to acknowledge expectations
    if (user.role !== "GA") {
      return res.status(403).json({ error: "Only Graduate Assistants can acknowledge expectations" });
    }

    // Validate payload strictly: only { goals: string[] }
    const parsed = GAAcknowledgeExpectationsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      });
    }

    const { goals } = parsed.data;

    // Make sure the appointment exists and belongs to this GA
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.gaId, user.id)));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Must be in ExpectationSet status
    if (appointment.status !== APPOINTMENT_STATUS.SET) {
      return res.status(400).json({
        error: `Appointment must be in ${APPOINTMENT_STATUS.SET} status to acknowledge expectations`,
      });
    }

    const existingExpectationData: AppointmentExpectationDraft =
      appointment.expectationData && typeof appointment.expectationData === "object"
        ? (appointment.expectationData as AppointmentExpectationDraft)
        : {};

    const existingGoals = Array.isArray(existingExpectationData.goals)
      ? existingExpectationData.goals
      : [];

    const updatedExpectationData: AppointmentExpectationData = {
      ...existingExpectationData,
      goals: [...existingGoals, ...goals], // append, do not overwrite mentor goals
      gaAcknowledged: true,
      gaAcknowledgedAt: new Date().toISOString(),
    };

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        expectationData: updatedExpectationData,
        status: APPOINTMENT_STATUS.AWAITING_SELF_EVAL,
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    return res.json(updatedAppointment);
  } catch (error) {
    console.error("Error acknowledging expectations:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
