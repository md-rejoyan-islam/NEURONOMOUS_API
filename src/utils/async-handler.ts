import { NextFunction, Request, Response } from "express";

/**
 * A wrapper function that handles try/catch for async route handlers.
 * This prevents the need for a try/catch block in every async controller function.
 * @param fn The asynchronous function to be wrapped.
 * @returns An Express route handler.
 */
export const asyncHandler =
  <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
