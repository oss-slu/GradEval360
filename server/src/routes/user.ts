import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../db/auth.js";
import { requireAuth } from "../middleware/auth.js";

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

router.get("/profile", requireAuth, (req, res) => {
    const user = (req as any).user;
    res.json({
        id: user.id,
        fullName: user.name,
        email: user.email,
        role: user.role,
        unitId: user.unitId ?? null,
        unitIds: user.unitIds,
    });
});

export default router;
