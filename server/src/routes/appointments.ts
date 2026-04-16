import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../db/index.js";
import { appointments, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { generateAppointmentCode } from "../lib/appointment-code.js";
import {
  APPOINTMENT_STATUS,
  FinalAcknowledgmentSchema,
  FinalSignOffPreparationSchema,
  GAAcknowledgeExpectationsSchema,
  MentorEvaluationSchema,
  MentorExpectationSettingSchema,
  SelfEvaluationSchema,
} from "../../../shared/schemas/appointment.js";

const router = Router();

type RequestUser = {
  id: string;
  role: "GA" | "Mentor" | "Admin";
  unitId?: string | null;
  unitIds?: string[];
  name?: string | null;
  fullName?: string | null;
};

type AppointmentExpectationDraft = {
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

type AppointmentExpectationData = AppointmentExpectationDraft & {
  goals: string[];
};

type AppointmentMentorEvaluationData = {
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

function getActorName(user: RequestUser) {
  return user.fullName ?? user.name ?? user.id;
}

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

async function listAppointmentsForUser(user: RequestUser) {
  if (user.role === "GA") {
    return db.select().from(appointments).where(eq(appointments.gaId, user.id));
  }

  if (user.role === "Mentor") {
    return db.select().from(appointments).where(eq(appointments.mentorId, user.id));
  }

  if (user.role === "Admin") {
    if (Array.isArray(user.unitIds) && user.unitIds.length > 0) {
      return db.select().from(appointments).where(inArray(appointments.unitId, user.unitIds));
    }

    if (user.unitId) {
      return db.select().from(appointments).where(eq(appointments.unitId, user.unitId));
    }

    return db.select().from(appointments);
  }

  return [];
}

function canAccessAppointment(user: RequestUser, appointment: any) {
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

router.get("/summary", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const result = await listAppointmentsForUser(user);
    const withCodes = await ensureAppointmentCodes(result ?? []);

    const statusCounts = Object.values(APPOINTMENT_STATUS).reduce<Record<string, number>>(
      (accumulator, status) => {
        accumulator[status] = 0;
        return accumulator;
      },
      {}
    );

    for (const appointment of withCodes) {
      statusCounts[appointment.status] = (statusCounts[appointment.status] ?? 0) + 1;
    }

    const totalAppointments = withCodes.length;
    const completedAppointments = withCodes.filter(
      (appointment) => appointment.status === APPOINTMENT_STATUS.FINAL
    ).length;
    const inProgressAppointments = withCodes.filter(
      (appointment) => appointment.status !== APPOINTMENT_STATUS.FINAL
    ).length;

    const pendingItems = withCodes
      .filter((appointment) => appointment.status !== APPOINTMENT_STATUS.FINAL)
      .map((appointment) => ({
        id: appointment.id,
        appointmentCode: appointment.appointmentCode,
        status: appointment.status,
        gaId: appointment.gaId,
        mentorId: appointment.mentorId,
        unitId: appointment.unitId,
      }));

    return res.json({
      totalAppointments,
      completedAppointments,
      inProgressAppointments,
      completionPercentage:
        totalAppointments === 0 ? 0 : Math.round((completedAppointments / totalAppointments) * 100),
      statusCounts,
      pendingItems,
    });
  } catch (error) {
    console.error("Error fetching appointment summary:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const result = await listAppointmentsForUser(user);
    const withCodes = await ensureAppointmentCodes(result ?? []);
    const enriched = await enrichAppointments(withCodes);

    return res.json(enriched);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const appointmentId = req.params.id;

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (!canAccessAppointment(user, appointment)) {
      return res.status(403).json({ error: "Forbidden" });
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
    const user = req.user as RequestUser;
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

    const updatedExpectationData: AppointmentExpectationData = {
      ...existingExpectationData,
      ...parsed.data,
      goals: parsed.data.goals,
      mentorGoals: parsed.data.goals,
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

router.patch("/:id/expectations", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const appointmentId = req.params.id;

    if (user.role !== "GA") {
      return res.status(403).json({ error: "Only Graduate Assistants can acknowledge expectations" });
    }

    const parsed = GAAcknowledgeExpectationsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      });
    }

    const { goals } = parsed.data;

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.gaId, user.id)));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

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
    const existingMentorGoals = Array.isArray(existingExpectationData.mentorGoals)
      ? existingExpectationData.mentorGoals
      : existingGoals;

    const updatedExpectationData: AppointmentExpectationData = {
      ...existingExpectationData,
      goals: [...existingMentorGoals, ...goals],
      mentorGoals: existingMentorGoals,
      gaGoals: goals,
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

router.post("/:id/self-eval", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const { id } = req.params;

    if (user.role !== "GA") {
      return res.status(403).json({ error: "Only Graduate Assistants can submit self-evaluations" });
    }

    const parsed = SelfEvaluationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
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

router.post("/:id/mentor-evaluation", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const appointmentId = req.params.id;

    if (user.role !== "Mentor") {
      return res.status(403).json({ error: "Only mentors can submit mentor evaluations" });
    }

    const parsed = MentorEvaluationSchema.safeParse(req.body);
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

    if (appointment.status !== APPOINTMENT_STATUS.SELF_EVAL_DONE) {
      return res.status(400).json({
        error: `Appointment must be in ${APPOINTMENT_STATUS.SELF_EVAL_DONE} to submit mentor evaluation`,
      });
    }

    const existingMentorEvaluationData: AppointmentMentorEvaluationData =
      appointment.mentorEvaluationData && typeof appointment.mentorEvaluationData === "object"
        ? (appointment.mentorEvaluationData as AppointmentMentorEvaluationData)
        : {};

    const updatedMentorEvaluationData: AppointmentMentorEvaluationData = {
      ...existingMentorEvaluationData,
      ...parsed.data,
      evaluationSubmittedAt: new Date().toISOString(),
      evaluationSubmittedBy: getActorName(user),
    };

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        mentorEvaluationData: updatedMentorEvaluationData,
        status: APPOINTMENT_STATUS.MENTOR_EVAL_DONE,
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    return res.json(updatedAppointment);
  } catch (error) {
    console.error("Error submitting mentor evaluation:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/final-signoff", requireAuth, async (req: any, res) => {
  try {
    const user = req.user as RequestUser;
    const appointmentId = req.params.id;

    if (user.role !== "Admin") {
      return res.status(403).json({ error: "Only admins can complete final sign-off" });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId));

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (!canAccessAppointment(user, appointment)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const existingMentorEvaluationData: AppointmentMentorEvaluationData =
      appointment.mentorEvaluationData && typeof appointment.mentorEvaluationData === "object"
        ? (appointment.mentorEvaluationData as AppointmentMentorEvaluationData)
        : {};

    if (appointment.status === APPOINTMENT_STATUS.MENTOR_EVAL_DONE) {
      const parsed = FinalSignOffPreparationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        });
      }

      const updatedMentorEvaluationData: AppointmentMentorEvaluationData = {
        ...existingMentorEvaluationData,
        signOffDecision: parsed.data.signOffDecision,
        signOffNotes: parsed.data.signOffNotes,
        signOffPreparedAt: new Date().toISOString(),
        signOffPreparedBy: getActorName(user),
      };

      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          mentorEvaluationData: updatedMentorEvaluationData,
          status: APPOINTMENT_STATUS.AWAITING_SIGN_OFF,
        })
        .where(eq(appointments.id, appointmentId))
        .returning();

      return res.json(updatedAppointment);
    }

    if (appointment.status === APPOINTMENT_STATUS.AWAITING_SIGN_OFF) {
      const parsed = FinalAcknowledgmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        });
      }

      const updatedMentorEvaluationData: AppointmentMentorEvaluationData = {
        ...existingMentorEvaluationData,
        finalAcknowledged: parsed.data.finalAcknowledged,
        finalAcknowledgedAt: new Date().toISOString(),
        finalAcknowledgedBy: getActorName(user),
      };

      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          mentorEvaluationData: updatedMentorEvaluationData,
          status: APPOINTMENT_STATUS.FINAL,
        })
        .where(eq(appointments.id, appointmentId))
        .returning();

      return res.json(updatedAppointment);
    }

    return res.status(400).json({
      error: `Appointment must be in ${APPOINTMENT_STATUS.MENTOR_EVAL_DONE} or ${APPOINTMENT_STATUS.AWAITING_SIGN_OFF} to complete final sign-off`,
    });
  } catch (error) {
    console.error("Error submitting final sign-off:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
