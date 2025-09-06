import { Request, Response } from "express";
import { getAllLogService } from "../services/logs.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

export const getAllLogs = asyncHandler(async (req: Request, res: Response) => {
  const { level, search, startDate, endDate, sortBy, sortOrder, page, limit } =
    req.query;

  const query: {
    level?: string;
    search?: { $regex: string; $options: string };
    timestamp?: { $gte?: Date; $lte?: Date };
    sortBy: string;
    sortOrder: "asc" | "desc";
    page: number;
    limit: number;
  } = {
    sortBy: "timestamp",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  };

  if (level) {
    query.level = level as string;
  }

  if (search) {
    query.search = { $regex: search as string, $options: "i" };
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) {
      query.timestamp.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.timestamp.$lte = new Date(endDate as string);
    }
  }

  if (sortBy) {
    query.sortBy = sortBy as string;
  }
  if (sortOrder) {
    query.sortOrder = sortOrder as "asc" | "desc";
  }
  if (page) {
    query.page = parseInt(page as string, 10);
  }
  if (limit) {
    query.limit = parseInt(limit as string, 10);
  }

  const { logs, pagination } = await getAllLogService(query);

  successResponse(res, {
    message: "Logs fetched successfully",
    statusCode: 200,
    payload: {
      pagination,
      data: logs,
    },
  });
});
