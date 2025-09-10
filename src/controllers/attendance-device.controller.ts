import { Request, Response } from "express";
import { getAllAttendanceDevicesService } from "../services/attendance-device.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

export const getAllAttendanceDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const devices = await getAllAttendanceDevicesService();

    successResponse(res, {
      message: "Attendance devices retrieved successfully",
      payload: {
        data: devices,
      },
    });
  }
);
