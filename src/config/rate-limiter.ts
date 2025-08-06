import rateLimit from "express-rate-limit";
import createError from "http-errors";
import secret from "../app/secret";

const limiter = rateLimit({
  windowMs: secret.max_requests_window,
  max: secret.max_requests,
  message: "Too many requests from this IP, please try again after 5 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: () => {
    throw createError(
      429,
      "Too many requests from this IP, please try again after 5 minutes"
    );
  },
});

export default limiter;
