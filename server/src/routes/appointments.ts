import { Router } from "express";
import { db } from "../db/index.js";
import { appointments, users } from "../db/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js"; // adjust path if needed
import {
  APPOINTMENT_STATUS,
  GAAcknowledgeExpectationsSchema,
  SelfEvaluationSchema,
} from "../../../shared/schemas/appointment.js";

const router = Router();
//removed: requireAuth
router.post("/:id/self-eval", requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const parsed = SelfEvaluationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    await db
      .update(appointments)
      .set({
        selfEvaluationData: parsed.data,
        status: "SelfEvaluationCompleted",
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
  mentorNotes?: string;
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
            if (!user.unitId) {
                return res.status(403).json({ error: "Forbidden" });
            }
            result = await db
                .select()
                .from(appointments)
                .where(eq(appointments.unitId, user.unitId));
        }

        //Those with an UNKNOWN ROLE
        else {
            return res.status(403).json({ error: "Forbidden" });
        }

        const safeResult = result ?? [];
        if (!safeResult.length) {
            return res.json(safeResult);
        }

        const userIds = Array.from(
            new Set(safeResult.flatMap((appt: any) => [appt.gaId, appt.mentorId].filter(Boolean)))
        );

        const userRows = await db
            .select({ id: users.id, fullName: users.fullName })
            .from(users)
            .where(inArray(users.id, userIds));

        const userMap = new Map(userRows.map((row) => [row.id, row.fullName]));

        const enriched = safeResult.map((appt: any) => ({
            ...appt,
            gaName: userMap.get(appt.gaId) ?? null,
            mentorName: userMap.get(appt.mentorId) ?? null,
        }));

        return res.json(enriched);
    } catch(error) {
        console.error("Error fetching appointments:", error);
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
