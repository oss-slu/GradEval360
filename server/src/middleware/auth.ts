import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../db/auth.js";

import { db } from "../db/index.js"; 
import { users, userUnits } from "../db/schema.js";  // adjust if needed
import { eq, sql } from "drizzle-orm";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({ 
        headers: fromNodeHeaders(req.headers) 
    });

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const email = session.user?.email;
        if (!email) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const normalizedEmail = email.toLowerCase();
        const dbUser = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${normalizedEmail}`)
            .limit(1);
        if (!dbUser.length) {
            return res.status(401).json({ error: "User not found" });
        }

        const unitRows = await db
            .select()
            .from(userUnits)
            .where(eq(userUnits.userId, dbUser[0].id));
        const unitIds = unitRows.map((row) => row.unitId);

        // Attach the user and role to the request for easy access in routes
        (req as any).user = {
            ...session.user,
            id: dbUser[0].id,
            role: dbUser[0].role,
            unitId: dbUser[0].unitId,
            unitIds,
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error" });
    } 
};
