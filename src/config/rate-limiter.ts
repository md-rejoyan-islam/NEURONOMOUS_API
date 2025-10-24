import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import createError from "http-errors";
import secret from "../app/secret";
import { logger } from "../utils/logger";

const limiter = rateLimit({
  windowMs: secret.max_requests_window,
  max: secret.max_requests,
  message: "Too many requests from this IP, please try again after 5 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response, next: NextFunction) => {
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] || // proxy-safe
      req.socket.remoteAddress || // direct connection
      "unknown";

    logger.warn("Too many requests from a single IP", {
      source: "Rate Limiter",
      ip,
    });

    next(
      createError(
        429,
        "Too many requests from this IP, please try again after 5 minutes"
      )
    );
  },
});

export default limiter;
