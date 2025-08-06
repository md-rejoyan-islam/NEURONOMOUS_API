import createError from "http-errors";
import { mqttClient } from "../config/mqtt";
import { scheduleExpireJob } from "../cron/scheduler";
import { DeviceModel } from "../models/device.model";
import { dateFormat, formatBytes, formatUptime } from "../utils/date-format";
import { errorLogger, logger } from "../utils/logger";

// get all devices from the database
export const getAllDeviceService = async () => {
  const devices = await DeviceModel.find().lean();

  console.log(devices);

  return devices.map((device) => ({
    ...device,
    last_seen: dateFormat(device.last_seen),
    uptime: formatUptime(device.uptime),
    free_heap: formatBytes(device.free_heap),
  }));
};

// send a notice to a specific device
export const sendNoticeToDeviceService = async (
  id: string,
  notice: string,
  duration: number,
  pending?: boolean
) => {
  if (!notice || typeof notice !== "string") {
    throw createError(400, "Notice must be a string.");
  }

  if (typeof duration !== "number" || duration < 0) {
    throw createError(400, "Duration must be a non-negative number.");
  }

  const device = await DeviceModel.findOne({ id });
  if (!device) {
    throw createError(404, `Device ${id} not found.`);
  }

  // if the device is offline, set pending_notice to true
  if (device.status === "offline") {
    device.pending_notice = true;
    await device.save();
  }

  const topic = `device/${id}/notice`;
  mqttClient.publish(
    topic,
    notice,
    {
      qos: 1, // Ensure the message is delivered at least once
      retain: false, // Do not retain the message
    },
    (err) => {
      if (err) throw createError(500, "MQTT publish failed.");
      else {
        if (pending) {
          return logger.info(`Pending notice set for device ${id}`);
        }
        logger.info(`Notice sent to device ${id}`);
      }
    }
  );

  const updatedDevice = await updateDeviceService(id, {
    current_notice: notice,
    duration,
  });

  if (duration > 0) {
    scheduleExpireJob(updatedDevice.id, duration * 1000); // Convert minutes to milliseconds
  }
};

// change the mode of a specific device
export const changeDeviceModeService = async (id: string, mode: string) => {
  const device = await DeviceModel.findOne({ id });
  if (!device) {
    throw createError(404, `Device ${id} not found.`);
  }

  const modeValue = mode === "clock" ? "0" : "1";
  const topic = `device/${id}/mode`;
  mqttClient.publish(topic, modeValue, (err) => {
    if (err) throw createError(500, "MQTT publish failed.");
  });
};

// create a new device in the database
export const createDeviceService = async (payload: {
  id: string;
  status: string;
  mode: string;
  current_notice: string;
  uptime: number;
  free_heap: number;
  timestamp: string;
}) => {
  const newDevice = new DeviceModel({
    id: payload.id,
    status: payload.status || "offline",
    last_seen: new Date(),
    mode: payload.mode || "clock",
    current_notice: payload.current_notice || "",
    uptime: payload.uptime || 0,
    free_heap: payload.free_heap || 0,
    timestamp: payload.timestamp || "",
  });

  await newDevice.save();
  return newDevice;
};

// update a device in the database
export const updateDeviceService = async (
  id: string,
  payload: {
    status?: string;
    mode?: string;
    current_notice?: string;
    uptime?: number;
    free_heap?: number;
    timestamp?: string;
    duration?: number;
    pending_notice?: boolean;
  }
) => {
  const device = await DeviceModel.findOneAndUpdate(
    { id },
    {
      ...payload,
      last_seen: dateFormat(new Date()),
    },
    { new: true }
  );

  if (!device) {
    errorLogger.warn(`Device ${id} not found in database.`);
    throw createError(404, `Device ${id} not found.`);
  }

  logger.info(`Device ${id} updated successfully`, {
    id: device.id,
  });
  return device;
};

export const expireNoticeById = async (id: string) => {
  console.log(`Notice expired for device ${id}`);

  mqttClient.publish(
    `device/${id}/mode`,
    "0",
    {
      qos: 1, // Ensure the message is delivered at least once
      retain: false, // Do not retain the message
    },
    (err) => {
      if (err) throw createError(500, "MQTT publish failed.");
      else logger.info(`Mode updated for device ${id}`);
    }
  );
};
