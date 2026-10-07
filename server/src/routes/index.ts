import { Router } from "express";
import userRouter from "./user.js";

import appointmentsRoutes from "./appointments.js";
import notificationsRouter from "./notifications.js";

const rootRouter = Router();

rootRouter.use("/", userRouter);
rootRouter.use("/appointments", appointmentsRoutes);
rootRouter.use("/notifications", notificationsRouter);

export default rootRouter;
