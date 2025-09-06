import { NextFunction, Response } from "express";
import createError from "http-errors";
import { IRequestWithUser, ROLE } from "../app/types";
import { logger } from "../utils/logger";

export const authorize = (roles: ROLE[]) => {
  return (req: IRequestWithUser, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as ROLE)) {
      logger.error({
        message: `Unauthorized access attempt by user: ${req.user?.email || "unknown"}`,
        status: 403,
        name: "ForbiddenError",
        stack: new Error().stack,
      });

      throw createError.Forbidden(
        "You do not have permission to access this resource"
      );
    }
    next();
  };
};
