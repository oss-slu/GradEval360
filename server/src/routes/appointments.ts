import { Router } from "express";
import { db } from "../db/index.js";
import { appointments } from "../db/schema.js";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js"; // adjust path if needed

const router = Router();

// Get api/appointments>
router.get("/", requireAuth, async (req: any, res) => {    
    try {
        const user = req.user;

        let result; 

        //GA - appointments
        if (user.role === "GA"){
            result = await db
                .select()
                .from(appointments)
                .where(
                    or(
                        eq(appointments.gaId, user.id),
                        eq(appointments.mentorId, user.id)
                    )
                );
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
            result = await db
                .select()
                .from(appointments)
        }

        //Those with no UNKNOW ROLE
        else {
            return res.status(403).json({error: "Forbidden"});
        }

        return res.json(result);
    } catch(error) {
        console.error("Error fetching appointments:", error);
        return res.status(500).json({error: "Server error"});
    } 
});

export default router;