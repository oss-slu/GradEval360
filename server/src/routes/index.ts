import { Router } from "express";
import userRouter from "./user.js";

import appointmentsRoutes from "./appointments";

const rootRouter = Router();

// Mount individual feature routers
rootRouter.use("/", userRouter);
rootRouter.use("/appointments", appointmentsRoutes);

// Future: rootRouter.use("/appointments", appointmentRouter);

export default rootRouter;

