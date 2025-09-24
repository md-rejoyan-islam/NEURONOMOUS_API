import { Request, Response } from "express";
import createError from "http-errors";
import { Types } from "mongoose";
import { IRequestWithUser } from "../../app/types";

import clockService from "../../services/devices/clock.service";
import { asyncHandler } from "../../utils/async-handler";
import { isValidMongoId } from "../../utils/is-valid-mongo-id";
import { successResponse } from "../../utils/response-handler";

/**
 * @description Get all devices from the database.
 * @method GET
 * @route /api/v1/devices
 */
const getAllDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { role, _id } = req.user!;

    const { mode, status, search, type } = req.query;

    const result = await clockService.getAllDevices(
      _id as Types.ObjectId,
      role,
      {
        mode: mode as string,
        status: status as string,
        search: search as string,
        type: type as string,
      }
    );

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

const getDeviceById = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  if (!Types.ObjectId.isValid(deviceId)) {
    throw createError(400, "Invalid device ID format.");
  }

  const device = await clockService.getDeviceById(deviceId);

  successResponse(res, {
    message: `Device ${deviceId} fetched successfully`,
    statusCode: 200,
    payload: {
      data: device,
    },
  });
});

// Get all allowed access usrs for a device

/**
 * @description Get all allowed access users for a device.
 * @method GET
 * @route /api/v1/devices/:deviceId/access-users
 */
const getAllowedUsersForDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    if (!Types.ObjectId.isValid(deviceId)) {
      throw createError(400, "Invalid device ID format.");
    }

    // Assuming a service to get available fonts exists
    const fonts = await clockService.getAllowedUsersForDevice(deviceId);

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

const changeSingleDeviceMode = asyncHandler(
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

    await clockService.changeDeviceMode(deviceId, mode);

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
const changeAllDevicesMode = asyncHandler(
  async (req: Request, res: Response) => {
    const { mode, deviceIds } = req.body;

    if (!["clock", "notice"].includes(mode)) {
      throw createError(400, "Invalid mode.");
    }

    // Assuming a service to change all devices mode exists
    await clockService.changeAllDevicesMode(mode, deviceIds);

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
const sendNoticeInDevice = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { notice, duration } = req.body;

  await clockService.sendNoticeToDevice(deviceId, notice, duration);

  successResponse(res, {
    message: `Notice sent to device ${deviceId}`,
    statusCode: 200,
  });
});

const updateDeviceFirmware = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    const { firmwareId } = req.body;
    if (!firmwareId) {
      throw createError(400, "Firmware ID is required.");
    }

    await clockService.updateDeviceFirmware(deviceId, firmwareId);

    successResponse(res, {
      message: `Firmware update for device ${deviceId} initiated`,
      statusCode: 200,
    });
  }
);

// restart Device
const restartDeviceById = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  if (!isValidMongoId(deviceId)) {
    throw createError(400, "Invalid device ID format.");
  }

  await clockService.restartDeviceById(deviceId);

  successResponse(res, {
    message: `Device ${deviceId} restart command sent successfully`,
    statusCode: 200,
  });
});

/**
 * @description Send notice to all devices by superadmin
 * @method POST
 * @route /api/v1/devices/send-notice
 */
const sendNoticeToAllDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const { notice, duration, deviceIds } = req.body;

    // Assuming a service to send notice to all devices exists
    await clockService.sendNoticeToAllDevices(notice, duration, deviceIds);

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

const scheduleNoticeForDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;
    const { notice, startTime, endTime } = req.body;

    await clockService.scheduleNotice(deviceId, notice, startTime, endTime);

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
const scheduleNoticeForAllDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const { notice, startTime, endTime, deviceIds } = req.body;

    // Assuming a service to schedule notice for all devices exists
    await clockService.scheduleNoticeToAllDevices(
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
const getScheduledNoticesInDevices = asyncHandler(
  async (req: Request, res: Response) => {
    const scheduledNotices = await clockService.getAllScheduledNotices();
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
const getScheduledNoticeInDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    const scheduledNotices =
      await clockService.getScheduledNoticesForDevice(deviceId);
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
const cancelScheduledNoticeForDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId, scheduledId } = req.params;
    await clockService.cancelScheduledNotice(deviceId, scheduledId);
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

const changeFontAndTimeFormat = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceId } = req.params;
    const { font, time_format } = req.body;

    await clockService.changeDeviceFontAndTimeFormat(
      deviceId,
      font,
      time_format
    );

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

const giveDeviceAccessToUsersInGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId } = req.params;
    const { userIds } = req.body;

    // Assuming a service to give device access to users exists
    await clockService.giveDeviceAccessToUsersInGroup(deviceId, userIds);

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
const revokeDeviceAccessFromUser = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId, userId } = req.params;

    // Assuming a service to revoke device access from a user exists
    await clockService.revokeDeviceAccessFromUser(deviceId, userId);
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

const getAvailableFontsInDevice = asyncHandler(
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

/**
 * @description Add device to group controller
 * @method POST
 * @route /api/v1/groups/:groupId/add-device
 * @access Private
 * @param {string} groupId - The ID of the group to which the device will be added
 * @body {string} deviceId - The ID of the device to be added
 * @returns {IGroup} Updated group with new devices
 */

const addClockToGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { deviceId, name, location } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await clockService.addClockToGroup(
      groupId,
      deviceId,
      name,
      location
    );

    successResponse(res, {
      message: "Device added to group successfully",
      payload: {
        data: group,
      },
    });
  }
);

const changeSingleDeviceScene = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId } = req.params;
    const { scene } = req.body;

    if (!req.user) {
      throw createError(401, "Unauthorized");
    }

    // const { _id: userId } = req.user;

    if (!["scene0", "scene1", "scene2"].includes(scene)) {
      throw createError(400, "Invalid scene.");
    }

    await clockService.changeDeviceScene(deviceId, scene);

    successResponse(res, {
      message: `Device ${deviceId} scene changed to ${scene}`,
      statusCode: 200,
    });
  }
);

const startStopwatchInDevice = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId } = req.params;

    if (!req.user) {
      throw createError(401, "Unauthorized");
    }

    console.log(req.body);

    const { start_time, end_time, mode, is_scheduled } = req.body; // mode 1= count up, 2= count down 0 = stop
    if (!["up", "down"].includes(mode)) {
      throw createError(400, "Invalid mode.");
    }
    // if (!is_scheduled) {
    //   throw createError(400, "is_scheduled is required.");
    // }

    if (typeof is_scheduled !== "boolean") {
      throw createError(400, "is_scheduled must be a boolean.");
    }

    if (!start_time || !end_time) {
      throw createError(400, "Start and end time are required.");
    }

    if (typeof start_time !== "number" || typeof end_time !== "number") {
      throw createError(400, "Start and end time must be numbers.");
    }

    if (Number(start_time) >= Number(end_time)) {
      throw createError(400, "Start time must be less than end time.");
    }

    await clockService.startStopwatchInDevice(deviceId, {
      start_time: Number(start_time),
      end_time: Number(end_time),
      mode,
      is_scheduled,
    });

    successResponse(res, {
      message: `Stopwatch started in device ${deviceId}`,
      statusCode: 200,
    });
  }
);

const stopStopwatchInDevice = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { deviceId, stopwatchId } = req.params;

    if (!req.user) {
      throw createError(401, "Unauthorized");
    }

    await clockService.stopStopwatchInDevice(deviceId, stopwatchId);

    successResponse(res, {
      message: `Stopwatch stopped in device ${deviceId}`,
      statusCode: 200,
    });
  }
);

const clockController = {
  stopStopwatchInDevice,
  startStopwatchInDevice,
  changeSingleDeviceScene,
  addClockToGroup,
  getAllDevices,
  getDeviceById,
  changeSingleDeviceMode,
  changeAllDevicesMode,
  sendNoticeInDevice,
  sendNoticeToAllDevices,
  scheduleNoticeForDevice,
  scheduleNoticeForAllDevices,
  getScheduledNoticesInDevices,
  getScheduledNoticeInDevice,
  cancelScheduledNoticeForDevice,
  changeFontAndTimeFormat,
  getAvailableFontsInDevice,
  getAllowedUsersForDevice,
  giveDeviceAccessToUsersInGroup,
  revokeDeviceAccessFromUser,
  updateDeviceFirmware,
  restartDeviceById,
};

export default clockController;
