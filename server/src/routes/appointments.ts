import { Router } from "express";
import { db } from "../db/index.js";
import { appointments, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth"; // adjust path if needed


const router = Router();

// Get api/appointments>
router.get("/", async (requestAnimationFrame, res) =>{
    try {
        const user = req.user;

        let result; 

        //GA - appointments
        if (user.role === "GA"){
            result = await db
                .select()
                .from(appointments)
                .where(eq(appointments.ga_id, user.id));
        }

        //Mentor - Apointments they supervise
        else if (user.role === "Admin") {
            result = await db
                .select()
                .from(appointments)
                .where(eq(appointments.mentor_id, user.id));
        }

        //Admin - appointments 
        else if (user.role === "Admin") {
            result = await db
                .select()
                .from(appointments)
                .where(eq(appointments.unit_id, user.unit_id));
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