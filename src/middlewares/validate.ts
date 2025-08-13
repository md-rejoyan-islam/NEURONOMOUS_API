import { NextFunction, Request, Response } from "express";
import z from "zod";
import { asyncHandler } from "../utils/async-handler";
const validate = (schema: z.ZodType) =>
  asyncHandler(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      return next();
    }
  );

export default validate;
