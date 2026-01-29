import { Router } from "express";
import userRouter from "./user.js";

const rootRouter = Router();

// Mount individual feature routers
rootRouter.use("/", userRouter);
// Future: rootRouter.use("/appointments", appointmentRouter);

export default rootRouter;