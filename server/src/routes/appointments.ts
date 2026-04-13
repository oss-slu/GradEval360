import { Router } from "express";
import { db } from "../db/index.js";
import { appointments, users } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js"; // adjust path if needed
import { SelfEvaluationSchema } from "../../../shared/schemas/appointment"; 

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

        //Those with no UNKNOW ROLE
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

export default router;
