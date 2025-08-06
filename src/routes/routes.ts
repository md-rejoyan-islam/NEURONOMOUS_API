import { Request, Response, Router } from "express";
import createError from "http-errors";
import errorHandler from "../middlewares/error-handler";
import { successResponse } from "../utils/response-handler";
import devicesRouter from "./device.routes";

const router = Router();

// home route
router.get("/", (_, res) => {
  successResponse(res, {
    message: "Welcome to the IoT Backend Service!",
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
router.use("/api/v1/devices", devicesRouter);

// 404 route
router.use("", (req: Request, _res: Response) => {
  throw createError.NotFound(
    `Did not find the requested resource- ${req.originalUrl}`
  );
});

// error handler
router.use(errorHandler);

export default router;
