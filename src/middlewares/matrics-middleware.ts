import { NextFunction, Request, Response } from "express";
import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

// Define a counter for total requests per route
const httpRequestCount = new client.Counter({
  name: "http_request_total",
  help: "Total number of HTTP requests by method, route, and status code.",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Define a histogram for request duration
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_milliseconds",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
  // Adjust buckets as needed for your app's performance
  buckets: [100, 500, 1000, 2000, 5000, 10000, 30000, 60000],
});

/**
 * Custom middleware to collect metrics for each route.
 */
const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationMicroseconds.startTimer();

  res.on("finish", () => {
    // Capture the route pattern from req.route.path, not req.path
    const route = req.route ? req.route.path : "unknown_route";
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Increment the request counter
    httpRequestCount.labels(method, route, statusCode).inc();

    // Observe the request duration
    end({ method, route, status_code: statusCode });
  });

  next();
};

export { metricsMiddleware, register };
