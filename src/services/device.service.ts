import createError from "http-errors";
import mongoose, { Types } from "mongoose";
import { mqttClient } from "../config/mqtt";
import {
  cancelScheduledNoticeJob,
  scheduleExpireJob,
  scheduleNoticeJob,
} from "../cron/scheduler";
import { DeviceModel } from "../models/device.model";
import { UserModel } from "../models/user.model";
import { dateFormat, formatBytes, formatUptime } from "../utils/date-format";
import { errorLogger, logger } from "../utils/logger";
import {
  IDevice,
  IUserWithPopulateDevices,
  IUserWithPopulateGroup,
} from "../utils/types";

// Utility to publish messages to a device
const publishToDevice = async (
  id: string,
  topicSuffix: string,
  message: string
) => {
  const topic = `device/${id}/${topicSuffix}`;
  try {
    await new Promise<void>((resolve, reject) => {
      mqttClient.publish(topic, message, { qos: 1, retain: false }, (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
      logger.info(`Message "${message}" sent to ${topic}.`); // Log successful publish
    });
  } catch (error) {
    errorLogger.error(`Error publishing to ${topic}:`, error); // Log the error
    throw createError(500, `MQTT publish to ${topic} failed .`);
  }
};

// Update device status, handle pending notices
export const updateDeviceStatusAndHandlePendingNotice = async (
  id: string,
  status: "online" | "offline",
  payload: {
    uptime: number;
    mode: "clock" | "notice";
    free_heap: number;
    notice: string;
  }
) => {
  const device = await DeviceModel.findOne({ id });

  if (device) {
    // If device comes online, send pending notice if it exists
    if (
      status === "online" &&
      device.status === "offline" &&
      device.pending_notice
    ) {
      await publishToDevice(id, "notice", device.notice!);
      await publishToDevice(id, "mode", "1"); // Switch to notice mode
      await DeviceModel.findByIdAndUpdate(device._id, {
        status: "online",
        pending_notice: false,
        last_seen: Date.now(),
        ...payload,
      });
      // Start a cron job to expire the notice
      if (device.duration) {
        scheduleExpireJob(id, device.duration);
        // s1cheduleNoticeJob(
        //   id,
        //   device.duration,
        //   new Date(Date.now() + device.duration * 60000)
        // );
      }
    } else {
      // Just update the status and other info
      await DeviceModel.findByIdAndUpdate(device._id, {
        status,
        last_seen: Date.now(),
        ...payload,
      });
    }
  } else {
    // If device doesn't exist, create it
    await createOrUpdateDeviceService({ id, status, ...payload });
  }
};

// Change a single device's mode
export const changeDeviceModeService = async (
  id: string,
  // userId: Types.ObjectId,
  mode: "clock" | "notice"
) => {
  const device = await DeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  // Do not publish if already in the requested mode
  if (device.mode === mode) return device;

  const modeValue = mode === "clock" ? "0" : "1";

  await publishToDevice(device.id, "mode", modeValue);

  return DeviceModel.findByIdAndUpdate(
    device._id,
    { mode, last_seen: Date.now() },
    { new: true }
  );
};

// Change mode for all devices
export const changeAllDevicesModeService = async (mode: "clock" | "notice") => {
  const devices = await DeviceModel.find({});
  for (const device of devices) {
    if (device.status === "online") {
      changeDeviceModeService(device.id, mode);
    }
  }
  await DeviceModel.updateMany(
    {
      status: "online",
    },
    { mode }
  );
  return { message: `All online devices switched to ${mode} mode.` };
};

// Send a notice to a single device (with duration)
export const sendNoticeToDeviceService = async (
  id: string,
  notice: string,
  duration: number | null
) => {
  const device = await DeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  // Save the notice and duration to history
  const historyEntry = { message: notice, timestamp: Date.now() };
  device.history.push(historyEntry);

  console.log("notice", notice, duration);

  // If the device is offline, set pending_notice flag
  if (device.status === "offline") {
    device.pending_notice = true;
    device.notice = notice;
    device.duration = duration;
    await device.save();
    if (duration && duration > 0) {
      scheduleExpireJob(id, duration);
    }
    return device;
  }

  // If online, publish the notice and mode change
  await publishToDevice(device.id, "notice", notice);
  await publishToDevice(device.id, "mode", "1"); // Switch to notice mode

  // Save to DB and schedule the job
  await DeviceModel.findByIdAndUpdate(device._id, {
    notice,
    duration,
    mode: "notice",
    last_seen: Date.now(),
    history: device.history,
  });
  if (duration && duration > 0) {
    console.log("Scheduling expire job for", id, "with duration", duration);

    scheduleExpireJob(id, duration);
  }

  return device;
};
// Show notice on all devices
export const sendNoticeToAllDevicesService = async (
  notice: string,
  duration: number | null
) => {
  const devices = await DeviceModel.find({});
  for (const device of devices) {
    // if (device.status === "online") {
    sendNoticeToDeviceService(device.id, notice, duration);
    // }
  }
  return { message: `Notice sent to all online devices.` };
};

// Send a scheduled notice to a single device
export const scheduleNoticeService = async (
  id: string,
  notice: string,
  startTime: number,
  endTime: number
) => {
  const device = await DeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  // check if any sceduled notice overlaps
  const overlappingNotice = device.scheduled_notices.find((scheduled) => {
    const scheduledEndTime = scheduled.start_time + scheduled.duration * 60000; // Convert minutes to milliseconds
    return scheduled.start_time < endTime && scheduledEndTime > startTime;
  });
  if (overlappingNotice) {
    throw createError(
      400,
      `Scheduled notice overlaps with another notice for device ${id}.`
    );
  }

  const schedule = {
    id: new mongoose.Types.ObjectId().toString(), // Generate a unique ID
    notice,
    start_time: startTime,
    duration: (endTime - startTime) / 60000, // Convert milliseconds to minutes
  };

  // Store the scheduled notice in the database
  device.scheduled_notices.push(schedule);

  await device.save();

  // Schedule a cron job to send the notice at the specified time
  scheduleNoticeJob(
    id,
    schedule.id,
    (endTime - startTime) / 60000,
    new Date(startTime)
  );

  return device;
};

// Send a scheduled notice to all devices
export const scheduleNoticeToAllDevicesService = async (
  notice: string,
  startTime: number,
  endTime: number
) => {
  const devices = await DeviceModel.find({});
  for (const device of devices) {
    // Schedule the notice for each device
    await scheduleNoticeService(device.id, notice, startTime, endTime);
  }
  return { message: `Scheduled notice sent to all devices.` };
};

// Get all scheduled notices
export const getAllScheduledNoticesService = async () => {
  return DeviceModel.find({}).select("id name scheduled_notices").lean();
};

// Get scheduled notices for a specific device
export const getScheduledNoticesForDeviceService = async (id: string) => {
  const device = await DeviceModel.findById(id).lean();
  if (!device) throw createError(404, `Device ${id} not found.`);
  return device.scheduled_notices.map((notice) => ({
    ...notice,
    start_time: new Date(notice.start_time).toISOString(),
    end_time: new Date(
      notice.start_time + notice.duration * 60000
    ).toISOString(),
  }));
};

// Cancel a scheduled notice for a single device with scheduled id
export const cancelScheduledNoticeService = async (
  id: string,
  scheduledId: string
) => {
  const device = await DeviceModel.findOne({ id });
  if (!device) throw createError(404, `Device ${id} not found.`);
  // Find the scheduled notice by ID
  const scheduledNoticeIndex = device.scheduled_notices.findIndex(
    (notice) => notice.id === scheduledId
  );
  if (scheduledNoticeIndex === -1) {
    throw createError(404, `Scheduled notice ${scheduledId} not found.`);
  }
  // Cancel the cron job if it exists
  cancelScheduledNoticeJob(scheduledId);

  // Remove the scheduled notice from the device database
  device.scheduled_notices.splice(scheduledNoticeIndex, 1);
  await device.save();
  return {
    message: `Scheduled notice ${scheduledId} cancelled for device ${id}.`,
  };
};

// A helper function for the MQTT handler to create/update
export const createOrUpdateDeviceService = async (
  payload: Partial<IDevice>
) => {
  const { id, ...updateData } = payload;

  console.log("error from");

  const device = await DeviceModel.findOneAndUpdate(
    { id },
    {
      $set: {
        ...updateData,
        last_seen: Date.now(),
      },
      $setOnInsert: { id },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return device;
};

// Function to be called by the cron job to expire a notice
export const expireNoticeById = async (id: string) => {
  try {
    const device = await DeviceModel.findByIdAndUpdate(
      id,
      {
        mode: "clock",
        duration: null,
        end_time: null,
      },
      { new: true }
    );

    if (device) {
      // Publish an MQTT message to the device to change its mode
      await publishToDevice(device.id, "mode", "0");
      logger.info(`Notice expired for device ${id}. Switched to clock mode.`);
    } else {
      logger.warn(`Device ${id} not found when trying to expire notice.`);
    }
  } catch (err) {
    errorLogger.error(`Error expiring notice for device ${id}:`, err);
  }
};

// Function to be called by the cron job to send a scheduled notice
export const sendScheduledNotice = async (id: string, scheduleId: string) => {
  try {
    const device = await DeviceModel.findById(id);

    if (
      !device ||
      !device.scheduled_notices ||
      device.scheduled_notices.length === 0
    ) {
      return logger.warn(`No scheduled notice found for device ${id}.`);
    }

    const scheduledNotice = device.scheduled_notices.find(
      (notice) => notice.id === scheduleId
    );
    if (!scheduledNotice) {
      return logger.warn(
        `Scheduled notice ${scheduleId} not found for device ${id}.`
      );
    }

    const { notice, duration } = scheduledNotice;

    // Publish the notice to the device
    await publishToDevice(device.id, "notice", notice);
    await publishToDevice(device.id, "mode", "1"); // Switch to notice mode

    // clear the scheduled notice from the device
    await DeviceModel.findByIdAndUpdate(device._id, {
      $pull: { scheduled_notices: { id: scheduleId } },
    });

    logger.info(`Scheduled notice sent to device ${id}: "${notice}"`);

    // Now schedule the job to expire the notice after its duration
    scheduleExpireJob(id, duration);
  } catch (err) {
    errorLogger.error(`Error sending scheduled notice for device ${id}:`, err);
  }
};

// Get all devices from the database
export const getAllDevicesService = async (
  _id: Types.ObjectId,
  role: string
) => {
  let devices: IDevice[] = [];
  // If the user is a superadmin, return all devices
  if (role === "superadmin") {
    devices = await DeviceModel.find({}).lean();
  } else if (role === "admin") {
    // If the user is an admin, return devices associated with their group
    const user = (await UserModel.findById(_id)
      .populate({
        path: "group",
        populate: {
          path: "devices",
        },
      })
      .lean()) as IUserWithPopulateGroup | null;
    // Extract devices from the user's group
    devices = user?.group?.devices || [];
  }
  // If the user is a regular user, return only devices associated with them
  else {
    const users = (await UserModel.findById(_id)
      .populate("allowed_devices")
      .lean()) as IUserWithPopulateDevices | null;
    devices = users?.allowed_devices || [];
  }
  // const devices = await DeviceModel.find({}).lean();
  return devices.map((device) => ({
    ...device,
    last_seen: dateFormat(device.last_seen),
    uptime: formatUptime(device.uptime),
    free_heap: formatBytes(device.free_heap),
  }));
};

// Get a single device by ID
export const getDeviceByIdService = async (id: string) => {
  const device = await DeviceModel.findById(id).lean();
  if (!device) throw createError(404, `Device ${id} not found.`);
  return {
    ...device,
    last_seen: dateFormat(device.last_seen),
    uptime: formatUptime(device.uptime),
    free_heap: formatBytes(device.free_heap),
  };
};

// Change font and time format for a device
export const changeDeviceFontAndTimeFormatService = async (
  id: string,
  font?: string,
  timeFormat?: string
) => {
  const device = await DeviceModel.findOne({ id });
  if (!device) throw createError(404, `Device ${id} not found.`);
  // Update the device with new font and time format
  console.log(font, timeFormat);

  return device;
};
