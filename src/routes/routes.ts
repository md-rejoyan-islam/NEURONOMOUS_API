import { Request, Response, Router } from "express";
import createError from "http-errors";
import errorHandler from "../middlewares/error-handler";
import { successResponse } from "../utils/response-handler";
import authRouter from "./auth.routes";
import deviceRouter from "./device.routes";
import firmwareRouter from "./firmware.routes";
import groupRouter from "./group.routes";
import systemRouter from "./system.routes";
import userRouter from "./user.routes";

const router = Router();

// home route
router.get("/", (_, res) => {
  successResponse(res, {
    message: "Welcome to the IoT Backend Service.",
    statusCode: 200,
  });
});

// health check route
router.get("/health", (_, res) => {
  successResponse(res, {
    message: "Service is running smoothly!",
    statusCode: 200,
  });
});

// device routes
router.use("/api/v1/devices", deviceRouter);
// auth routes
router.use("/api/v1/auth", authRouter);
// user routes
router.use("/api/v1/users", userRouter);
// group routes
router.use("/api/v1/groups", groupRouter);
// firmware routes
router.use("/api/v1/firmwares", firmwareRouter);
// system routes
router.use("/api/v1/system", systemRouter);

// 404 route
router.use("", (req: Request, _res: Response) => {
  throw createError.NotFound(
    `Did not find the requested resource- ${req.originalUrl}`
  );
});

// error handler
router.use(errorHandler);

export default router;
