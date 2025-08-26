import { Request, Response } from "express";
import createError from "http-errors";
import { Types } from "mongoose";
import { IRequestWithUser } from "../app/types";
import {
  cancelScheduledNoticeService,
  changeAllDevicesModeService,
  changeDeviceFontAndTimeFormatService,
  changeDeviceModeService,
  getAllDevicesService,
  getAllowedUsersForDeviceService,
  getAllScheduledNoticesService,
  getDeviceByIdService,
  getScheduledNoticesForDeviceService,
  giveDeviceAccessToUsersInGroupService,
  restartDeviceByIdService,
  revokeDeviceAccessFromUserService,
  scheduleNoticeService,
  scheduleNoticeToAllDevicesService,
  sendNoticeToAllDevicesService,
  sendNoticeToDeviceService,
  updateDeviceFirmwareService,
} from "../services/device.service";
import { asyncHandler } from "../utils/async-handler";
import { isValidMongoId } from "../utils/is-valid-mongo-id";
import { successResponse } from "../utils/response-handler";

/**
 * @description Get all devices from the database.
 * @method GET
 * @route /api/v1/devices
 */
export const getAllDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { role, _id } = req.user!;

    const result = await getAllDevicesService(_id as Types.ObjectId, role);

    successResponse(res, {
      message: "Devices fetched successfully",
      statusCode: 200,
      payload: {
        data: result,
      },
    });
  }
);

/**
 * @description Get a specific device by its ID.
 * @method GET
 * @route /api/v1/devices/:deviceId
 */

export const getDeviceById = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    if (!Types.ObjectId.isValid(deviceId)) {
      throw createError(400, "Invalid device ID format.");
    }

    const device = await getDeviceByIdService(deviceId);

    successResponse(res, {
      message: `Device ${deviceId} fetched successfully`,
      statusCode: 200,
      payload: {
        data: device,
      },
    });
  }
);

// Get all allowed access usrs for a device

/**
 * @description Get all allowed access users for a device.
 * @method GET
 * @route /api/v1/devices/:deviceId/access-users
 */
export const getAllowedUsersForDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    if (!Types.ObjectId.isValid(deviceId)) {
      throw createError(400, "Invalid device ID format.");
    }

    // Assuming a service to get available fonts exists
    const fonts = await getAllowedUsersForDeviceService(deviceId);

    successResponse(res, {
      message: `Available fonts for device ${deviceId} fetched successfully`,
      statusCode: 200,
      payload: {
        data: fonts,
      },
    });
  }
);

/**
 * @description Change the mode of a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/change-mode
 */

export const changeSingleDeviceMode = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId } = req.params;
    const { mode } = req.body;

    if (!req.user) {
      throw createError(401, "Unauthorized");
    }

    // const { _id: userId } = req.user;

    if (!["clock", "notice"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode." });
    }

    await changeDeviceModeService(deviceId, mode);

    successResponse(res, {
      message: `Device ${deviceId} mode changed to ${mode}`,
      statusCode: 200,
    });
  }
);

/**
 * @description Change all devices mode by superadmin
 * @method POST
 * @route /api/v1/devices/change-mode
 */
export const changeAllDevicesMode = asyncHandler(
  async (req: Request, res: Response) => {
    const { mode, deviceIds } = req.body;

    if (!["clock", "notice"].includes(mode)) {
      throw createError(400, "Invalid mode.");
    }

    // Assuming a service to change all devices mode exists
    await changeAllDevicesModeService(mode, deviceIds);

    successResponse(res, {
      message: `All devices changed to ${mode} mode`,
      statusCode: 200,
    });
  }
);

/**
 * @description Send a notice for a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/send-notice
 */
export const sendNoticeInDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;
    const { notice, duration } = req.body;

    await sendNoticeToDeviceService(deviceId, notice, duration);

    successResponse(res, {
      message: `Notice sent to device ${deviceId}`,
      statusCode: 200,
    });
  }
);

export const updateDeviceFirmware = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    const { firmwareId } = req.body;
    if (!firmwareId) {
      throw createError(400, "Firmware ID is required.");
    }

    await updateDeviceFirmwareService(deviceId, firmwareId);

    successResponse(res, {
      message: `Firmware update for device ${deviceId} initiated`,
      statusCode: 200,
    });
  }
);

// restart Device
export const restartDeviceById = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    if (!isValidMongoId(deviceId)) {
      throw createError(400, "Invalid device ID format.");
    }

    await restartDeviceByIdService(deviceId);

    successResponse(res, {
      message: `Device ${deviceId} restart command sent successfully`,
      statusCode: 200,
    });
  }
);

/**
 * @description Send notice to all devices by superadmin
 * @method POST
 * @route /api/v1/devices/send-notice
 */
export const sendNoticeToAllDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const { notice, duration, deviceIds } = req.body;

    // Assuming a service to send notice to all devices exists
    await sendNoticeToAllDevicesService(notice, duration, deviceIds);

    successResponse(res, {
      message: "Notice sent to all devices successfully",
      statusCode: 200,
    });
  }
);

/**
 * @description Send scheduled notice to a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/schedule-notice
 */

export const scheduleNoticeForDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;
    const { notice, startTime, endTime } = req.body;

    await scheduleNoticeService(deviceId, notice, startTime, endTime);

    successResponse(res, {
      message: `Notice scheduled for device ${deviceId}`,
      statusCode: 200,
    });
  }
);

/**
 * @description Schedule notice for all devices.
 * @method POST
 * @route /api/v1/devices/schedule-notice
 */
export const scheduleNoticeForAllDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const { notice, startTime, endTime, deviceIds } = req.body;

    // Assuming a service to schedule notice for all devices exists
    await scheduleNoticeToAllDevicesService(
      notice,
      startTime,
      endTime,
      deviceIds
    );

    successResponse(res, {
      message: "Notice scheduled for all devices successfully",
      statusCode: 200,
    });
  }
);

/**
 * @description Get all scheduled notices for all devices.
 * @method GET
 * @route /api/v1/devices/scheduled-notices
 */
export const getScheduledNoticesInDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const scheduledNotices = await getAllScheduledNoticesService();
    successResponse(res, {
      message: `All scheduled notices  fetched successfully`,
      payload: {
        data: scheduledNotices,
      },
      statusCode: 200,
    });
  }
);
/**
 * @description Get all scheduled notices for a specific device.
 * @method GET
 * @route /api/v1/devices/:deviceId/scheduled-notices
 */
export const getScheduledNoticeInDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    const scheduledNotices =
      await getScheduledNoticesForDeviceService(deviceId);
    successResponse(res, {
      message: `Scheduled notices for device ${deviceId} fetched successfully`,
      payload: {
        data: scheduledNotices,
      },
      statusCode: 200,
    });
  }
);

/**
 * @description Cancel a scheduled notice for a specific device.
 * @method DELETE
 * @route /api/v1/devices/:deviceId/scheduled-notices/:id
 */
export const cancelScheduledNoticeForDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId, scheduledId } = req.params;
    await cancelScheduledNoticeService(deviceId, scheduledId);
    successResponse(res, {
      message: `Scheduled notice with ID ${scheduledId} for device ${deviceId} cancelled successfully`,
      statusCode: 200,
    });
  }
);

/**
 * @description Change font, time-format for a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/change-font-time-format
 */

export const changeFontAndTimeFormat = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;
    const { font, time_format } = req.body;

    await changeDeviceFontAndTimeFormatService(deviceId, font, time_format);

    successResponse(res, {
      message: `Device ${deviceId} font and time format updated successfully`,
      statusCode: 200,
    });
  }
);

// giveDeviceAccessToUsersInGroup
/**
 * @description Give device access to users in a group.
 * @method POST
 * @route /api/v1/devices/:deviceId/give-device-access
 */

export const giveDeviceAccessToUsersInGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId } = req.params;
    const { userIds } = req.body;

    // Assuming a service to give device access to users exists
    await giveDeviceAccessToUsersInGroupService(deviceId, userIds);

    successResponse(res, {
      message: `Device access granted to users for device ${deviceId}`,
      statusCode: 200,
    });
  }
);

// revokeDeviceAccessFromUser
/**
 * @description Revoke device access from a user in a group.
 * @method POST
 * @route /api/v1/devices/:deviceId/revoke-device-access/:userId
 */
export const revokeDeviceAccessFromUser = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId, userId } = req.params;

    // Assuming a service to revoke device access from a user exists
    await revokeDeviceAccessFromUserService(deviceId, userId);
    successResponse(res, {
      message: `Device access revoked from user ${userId} for device ${deviceId}`,
      statusCode: 200,
    });
  }
);

/**
 * @description Get all available fonts for a specific device.
 * @method GET
 * @route /api/v1/devices/:deviceId/fonts
 */

export const getAvailableFontsInDevice = asyncHandler(
  async (_req: Request, res: Response) => {
    // Assuming a service to get available fonts exists
    const fonts = ["Arial", "Times New Roman", "Courier New", "Verdana"];

    successResponse(res, {
      message: "Available fonts fetched successfully",
      statusCode: 200,
      payload: {
        data: fonts,
      },
    });
  }
);
