import { Request, Response, Router } from "express";
import createError from "http-errors";
import errorHandler from "../middlewares/error-handler";
import { successResponse } from "../utils/response-handler";
import authRouter from "./auth.routes";
import courseRouter from "./course.routes";
import attendanceRouter from "./devices/attendance.routes";
import clockRouter from "./devices/clock.routes";
import firmwareRouter from "./firmware.routes";
import groupRouter from "./group.routes";
import logRouter from "./logs.routes";
import openAccessRouter from "./open-access.routes";
import studentRouter from "./student.routes";
import summaryRouter from "./summary.routes";
import userRouter from "./user.routes";

import { register } from "../middlewares/matrics-middleware";
import { asyncHandler } from "../utils/async-handler";

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

// metrics route
router.get(
  "/metrics",
  asyncHandler(async (_req, res) => {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  })
);

// device routes
router.use("/api/v1/clock-devices", clockRouter);
// auth routes
router.use("/api/v1/auth", authRouter);
// user routes
router.use("/api/v1/users", userRouter);
// group routes
router.use("/api/v1/groups", groupRouter);
// firmware routes
router.use("/api/v1/firmwares", firmwareRouter);
// summary routes
router.use("/api/v1/summary", summaryRouter);
// logs routes
router.use("/api/v1/logs", logRouter);
// logs routes
router.use("/api/v1/attendance-devices", attendanceRouter);
// course routes
router.use("/api/v1/courses", courseRouter);

// open access routes
router.use("/api/v1/open", openAccessRouter);
// student routes
router.use("/api/v1/students", studentRouter);

// 404 route
router.use("", (req: Request, _res: Response) => {
  throw createError.NotFound(
    `Did not find the requested resource- ${req.originalUrl}`
  );
});

// error handler
router.use(errorHandler);

export default router;
