import { Request, Response } from "express";

import { DeviceModel } from "../models/device.model";
import {
  changeDeviceModeService,
  getAllDeviceService,
  sendNoticeToDeviceService,
} from "../services/device.service";
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
 * @description Send a notice to a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/notice
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
 * @description Change the mode of a specific device.
 * @method POST
 * @route /api/v1/devices/:deviceId/mode
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
