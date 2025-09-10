import { Request, Response } from "express";
import {
  getAllAttendanceDevicesService,
  getAttendanceDeviceByIdService,
} from "../services/attendance-device.service";
import { asyncHandler } from "../utils/async-handler";
import { isValidMongoId } from "../utils/is-valid-mongo-id";
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

export const getAttendanceDeviceById = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    if (!isValidMongoId(deviceId)) {
      throw new Error("Invalid device ID.");
    }

    const device = await getAttendanceDeviceByIdService(deviceId);

    // To be implemented
    successResponse(res, {
      message: "Get attendance device by ID - To be implemented",
      payload: {
        data: device,
      },
    });
  }
);
