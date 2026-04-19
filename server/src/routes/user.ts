import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../db/auth.js";

const router = Router();

router.get("/me", async (req, res) => {
    const session = await auth.api.getSession({ 
        headers: fromNodeHeaders(req.headers) 
    });
    
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(session.user);
});

export default router;
