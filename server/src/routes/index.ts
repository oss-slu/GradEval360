import { Router } from "express";
import userRouter from "./user.js";

import appointmentsRoutes from "./appointments.js";

const rootRouter = Router();

rootRouter.use("/", userRouter);
rootRouter.use("/appointments", appointmentsRoutes);

export default rootRouter;
