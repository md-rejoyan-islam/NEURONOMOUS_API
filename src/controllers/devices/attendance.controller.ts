import { Request, Response } from "express";
import createError from "http-errors";

import attendanceDeviceService from "../../services/devices/attendance.service";
import { asyncHandler } from "../../utils/async-handler";
import { isValidMongoId } from "../../utils/is-valid-mongo-id";
import { successResponse } from "../../utils/response-handler";

export const getAllAttendanceDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const devices = await attendanceDeviceService.getAllAttendanceDevices();

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

    const device =
      await attendanceDeviceService.getAttendanceDeviceById(deviceId);

    // To be implemented
    successResponse(res, {
      message: "Get attendance device by ID - To be implemented",
      payload: {
        data: device,
      },
    });
  }
);

// get all attendance device for group
export const getAttendanceDevicesByGroupId = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "",
      payload: {
        pagination: {},
        data: [],
      },
    });
  }
);

// add attendance device in group
export const addAttendanceDeviceInGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { deviceId } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await attendanceDeviceService.addAttendanceDeviceToGroup(
      groupId,
      deviceId
    );

    successResponse(res, {
      message: "Device added to group successfully",
      payload: {
        data: group,
      },
    });
  }
);
// remove attendace device from group by id
export const removeAttendanceDeviceFromGroupById = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "",
      payload: {
        pagination: {},
        data: [],
      },
    });
  }
);
// give instuctor permission in attendance device
export const giveAttendanceDevicePermissionByInstuctorId = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "",
      payload: {
        pagination: {},
        data: [],
      },
    });
  }
);
// revolk instuctor permission in attendance device
export const revolkAttendanceDevicePermissionByInstuctorId = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "",
      payload: {
        pagination: {},
        data: [],
      },
    });
  }
);
