import { Request, Response } from "express";

import { DeviceModel } from "../models/device.model";
import {
  changeDeviceModeService,
  getAllDeviceService,
  sendNoticeToDeviceService,
} from "../services/_device.service";
import { dateFormat, formatBytes, formatUptime } from "../utils/date-format";
import { successResponse } from "../utils/response-handler";

/**
 * @description Get all devices from the database.
 * @method GET
 * @route /api/v1/devices
 */
export const getAllDevices = async (_req: Request, res: Response) => {
  const result = await getAllDeviceService();

  successResponse(res, {
    message: "Devices fetched successfully",
    payload: {
      data: result,
    },
    statusCode: 200,
  });
};

/**
 * @description Get a specific device by its ID.
 * @method GET
 * @route /api/v1/devices/:deviceId
 * @param {string} deviceId - The ID of the device to fetch.
 * @returns {IDevice} The device object with formatted fields.
 * @throws {404} If the device is not found.
 */

export const getDeviceById = async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  const device = await DeviceModel.findOne({ id: deviceId }).lean();

  if (!device) {
    return res.status(404).json({ error: "Device not found." });
  }

  successResponse(res, {
    message: `Device ${deviceId} fetched successfully`,
    payload: {
      data: {
        ...device,
        last_seen: dateFormat(device.last_seen),
        uptime: formatUptime(device.uptime),
        free_heap: formatBytes(device.free_heap),
      },
    },
    statusCode: 200,
  });
};

/**
 * @description Change the mode of a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/change-mode
 */

export const changeDeviceMode = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { mode } = req.body;

  if (!["clock", "notice"].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode." });
  }

  await changeDeviceModeService(deviceId, mode);

  successResponse(res, {
    message: `Device ${deviceId} mode changed to ${mode}`,
    statusCode: 200,
    // payload: {
    //   deviceId,
    //   mode,
    // },
  });
};

/**
 * @description Change a notice for a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/change-notice
 */
export const sendNoticeToDevice = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { notice, duration } = req.body;

  await sendNoticeToDeviceService(deviceId, notice, duration);

  successResponse(res, {
    message: `Notice sent to device ${deviceId}`,
    statusCode: 200,
    // payload: {
    //   deviceId,
    //   notice,
    // },
  });
};

/**
 * @description Change font, time-format for a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/change-font-time-format
 */

export const changeFontAndTimeFormat = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { font, time_format } = req.body;

  // Validate input
  if (!font || !time_format) {
    return res
      .status(400)
      .json({ error: "Font and time format are required." });
  }

  // change logic

  // Update the device with new font and time format
  await DeviceModel.updateOne({ id: deviceId }, { font, time_format });

  successResponse(res, {
    message: `Device ${deviceId} font and time format updated successfully`,
    statusCode: 200,
  });
};
