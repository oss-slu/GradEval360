import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../db/auth.js";
import { requireAuth } from "src/middleware/auth.js";
//import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
    const dbUser = (req as any).dbUser;
    //const session = await auth.api.getSession({ 
        //headers: fromNodeHeaders(req.headers) 
    //});
    //
    if (!dbUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        role: dbUser.role,
        unitId: dbUser.unitId??null, 
        unitIds: dbUser.unitIds??[],

    })
    //res.json(session.user);
});

router.get("/profile", requireAuth, (req, res) => {
    const dbUser = (req as any).dbUser;

    //const user = session.user;
    if (!dbUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        role: dbUser.role,
        unitId: dbUser.unitId ?? null,
        unitIds: dbUser.unitIds ?? [],
    });
});

export default router;
