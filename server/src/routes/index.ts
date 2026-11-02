import { Router } from "express";
import userRouter from "./user.js";

import appointmentsRoutes from "./appointments.js";
import notificationsRouter from "./notifications.js";
import auditLogsRouter from "./audit-logs.js";

const rootRouter = Router();

rootRouter.use("/", userRouter);
rootRouter.use("/appointments", appointmentsRoutes);
rootRouter.use("/notifications", notificationsRouter);
rootRouter.use("/audit-logs", auditLogsRouter);

export default rootRouter;
