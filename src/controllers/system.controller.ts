import { Request, Response } from "express";

import systemService from "../services/system.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

const getMemoryDetails = asyncHandler(async (_req: Request, res: Response) => {
  const result = systemService.getMemoryDetails();

  successResponse(res, {
    statusCode: 200,
    message: "Memory details fetched successfully",
    payload: {
      data: result,
    },
  });
});

const getCpuDetails = asyncHandler(async (_req: Request, res: Response) => {
  const result = await systemService.getCpuDetails();

  successResponse(res, {
    statusCode: 200,
    message: "CPU details fetched successfully",
    payload: { data: result },
  });
});

const systemController = {
  getMemoryDetails,
  getCpuDetails,
};

export default systemController;
