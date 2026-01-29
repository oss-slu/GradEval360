import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../db/auth.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({ 
        headers: fromNodeHeaders(req.headers) 
    });

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach the user and role to the request for easy access in routes
    (req as any).user = session.user; 
    
    next();
};