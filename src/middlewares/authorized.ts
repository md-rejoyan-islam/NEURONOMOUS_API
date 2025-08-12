import { NextFunction, Response } from "express";
import createError from "http-errors";
import { logger } from "../utils/logger";
import { IRequestWithUser, ROLE } from "../utils/types";

export const authorize = (roles: ROLE[]) => {
  return (req: IRequestWithUser, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as ROLE)) {
      logger.error(
        `Unauthorized access attempt by user: ${req.user?.email || "unknown"}`
      );

      throw createError.Forbidden(
        "You do not have permission to access this resource"
      );
    }
    next();
  };
};
