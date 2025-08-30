import { Request, Response } from "express";
import {
  getCpuDetailsService,
  getMemoryDetailsService,
} from "../services/system.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

export const getMemoryDetails = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = getMemoryDetailsService();

    successResponse(res, {
      statusCode: 200,
      message: "Memory details fetched successfully",
      payload: {
        data: result,
      },
    });
  }
);

export const getCpuDetails = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getCpuDetailsService();

    successResponse(res, {
      statusCode: 200,
      message: "CPU details fetched successfully",
      payload: { data: result },
    });
  }
);
