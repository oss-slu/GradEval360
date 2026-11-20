import { Router } from "express";
import userRouter from "./user.js";

import appointmentsRoutes from "./appointments.js";
import notificationsRouter from "./notifications.js";
import auditLogsRouter from "./audit-logs.js";
import gaRosterRouter from "./ga-roster.js";

const rootRouter = Router();

rootRouter.use("/", userRouter);
rootRouter.use("/appointments", appointmentsRoutes);
rootRouter.use("/notifications", notificationsRouter);
rootRouter.use("/audit-logs", auditLogsRouter);
rootRouter.use("/ga-roster", gaRosterRouter);

export default rootRouter;
