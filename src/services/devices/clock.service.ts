import createError from "http-errors";
import mongoose, { Types } from "mongoose";
import secret from "../../app/secret";
import { IDevice, IUser } from "../../app/types";
import { CLOCK_HEADER_TOPIC, mqttClient } from "../../config/mqtt";
import {
  cancelScheduledNoticeJob,
  scheduleExpireJob,
  scheduleNoticeJob,
} from "../../cron/scheduler";
import { ClockDeviceModel } from "../../models/devices/clock.model";
import { FirmwareModel } from "../../models/firmware.model";
import { GroupModel } from "../../models/group.model";
import { Schedule } from "../../models/schedule.model";
import { UserModel } from "../../models/user.model";
import { emitDeviceStatusUpdate } from "../../socket";
import { dateFormat, formatBytes, formatUptime } from "../../utils/date-format";
import { logger } from "../../utils/logger";
import { agenda } from "../agenda.service";

// Utility to publish messages to a device
const publishToDevice = async (
  macId: string,
  topicSuffix: string,
  message: string
) => {
  const topic = CLOCK_HEADER_TOPIC + `${macId}/${topicSuffix}`;
  try {
    await new Promise<void>((resolve, reject) => {
      mqttClient.publish(
        topic,
        message,
        {
          qos: 1,
          retain: false,
        },
        (err) => {
          if (err) {
            reject(err);
          }

          resolve();
        }
      );
      logger.info(`Message "${message}" sent to ${topic}.`); // Log successful publish
    });
  } catch (error) {
    logger.error({
      message: `Error publishing to ${topic}:`,
      status: 500,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : "No stack trace available",
    }); // Log the error
    throw createError(500, `MQTT publish to ${topic} failed .`);
  }
};

// Update device status, handle pending notices
const updateDeviceStatusAndHandlePendingNotice = async (
  id: string,
  status: "online" | "offline",
  payload: {
    uptime: number;
    mode: "clock" | "notice";
    free_heap: number;
    notice: string;
    firmware_version: string;
    timestamp: string;
  }
) => {
  const device = await ClockDeviceModel.findOne({ id }).lean();

  if (device) {
    // if (device.status !== status || device.mode !== payload.mode) {
    //   console.log("Updating device status for", device.mac_id, "to", status);
    emitDeviceStatusUpdate({ id });
    // }
    const macId = device.mac_id;

    // If device comes online, send pending notice if it exists
    if (
      status === "online" &&
      device.status === "offline" &&
      device.pending_notice
    ) {
      await publishToDevice(macId, "notice", device.notice!);
      await publishToDevice(macId, "mode", "1"); // Switch to notice mode
      await ClockDeviceModel.findByIdAndUpdate(device._id, {
        status: "online",
        pending_notice: false,
        last_seen: Date.now(),
        ...payload,
      });
      // Start a cron job to expire the notice
      if (device.duration) {
        scheduleExpireJob(id, device.duration);
      }
    } else {
      // Just update the status and other info
      await ClockDeviceModel.findByIdAndUpdate(device._id, {
        status,
        last_seen: Date.now(),
        ...payload,
      });
    }
  } else {
    // If device doesn't exist, create it
    await createOrUpdateDevice({ id, status, ...payload });
  }
};

// restart a device by id service
const restartDeviceById = async (id: string) => {
  const device = await ClockDeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);
  await publishToDevice(device.mac_id, "mode", "5");
};

// Change a single device's mode
const changeDeviceMode = async (
  id: string,
  // userId: Types.ObjectId,
  mode: "clock" | "notice"
) => {
  const device = await ClockDeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  // Do not publish if already in the requested mode
  if (device.mode === mode) return device;

  const modeValue = mode === "clock" ? "0" : "1";

  await publishToDevice(device.mac_id, "mode", modeValue);

  return ClockDeviceModel.findByIdAndUpdate(
    device._id,
    { mode, last_seen: Date.now() },
    { new: true }
  );
};

// Change mode for all devices
const changeAllDevicesMode = async (
  mode: "clock" | "notice",
  deviceIds: string[]
) => {
  const devices = await ClockDeviceModel.find({
    _id: { $in: deviceIds },
  })
    .select("status")
    .lean();

  if (devices.length === 0) {
    throw createError(404, "No devices found to change mode.");
  }

  if (devices.length !== deviceIds.length) {
    throw createError(404, "Some devices not found.");
  }

  for (const device of devices) {
    if (device.status === "online") {
      changeDeviceMode(device._id.toString(), mode);
    }
  }
  // await ClockDeviceModel.updateMany(
  //   {
  //     _id: { $in: devices },
  //     status: "online",
  //   },
  //   { mode }
  // );
};

// Send a notice to a single device (with duration)
const sendNoticeToDevice = async (
  id: string,
  notice: string,
  duration: number | null
) => {
  const device = await ClockDeviceModel.findById(id)
    .select("status mac_id _id")
    .exec();
  if (!device) throw createError(404, `Device ${id} not found.`);

  // Save the notice and duration to history
  // const historyEntry = { message: notice, timestamp: Date.now() };
  // device.history.push(historyEntry);

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
  await publishToDevice(device.mac_id, "notice", notice);
  await publishToDevice(device.mac_id, "mode", "1"); // Switch to notice mode

  // Save to DB and schedule the job
  await ClockDeviceModel.findByIdAndUpdate(device._id, {
    notice,
    duration,
    mode: "notice",
    last_seen: Date.now(),
    // history: device.history,
  });
  if (duration && duration > 0) {
    console.log("Scheduling expire job for", id, "with duration", duration);

    scheduleExpireJob(id, duration);
  }

  return device;
};
// Show notice on all devices
const sendNoticeToAllDevices = async (
  notice: string,
  duration: number | null,
  deviceIds: string[]
) => {
  const devices = await ClockDeviceModel.find({
    _id: { $in: deviceIds },
  })
    .select("id")
    .lean();
  for (const device of devices) {
    // if (device.status === "online") {
    sendNoticeToDevice(device._id.toString(), notice, duration);
    // }
  }
  return { message: `Notice sent to all online devices.` };
};

// update device firmware
const updateDeviceFirmware = async (id: string, firmwareId: string) => {
  const device = await ClockDeviceModel.findById(id).lean();
  if (!device) {
    throw createError(404, `Device with ID ${id} not found`);
  }
  const firmware = await FirmwareModel.findById(firmwareId).lean();
  if (!firmware) {
    throw createError(404, `Firmware with ID ${firmwareId} not found`);
  }

  // check device is online
  if (device.status !== "online") {
    throw createError(400, `Device with ID ${id} is offline`);
  }

  try {
    const firmwareTopic = CLOCK_HEADER_TOPIC + `${device.mac_id}/ota/control`;

    const downloadUrl = `${secret.FIRMWARE_BASE_URL}/${firmwareId}/download`;
    console.log("Firmware download URL:", downloadUrl);

    // const downloadUrl = `${secret.client_url}/api/v1/firmwares/68ad5507edcf1af037c9a5fe/download`;
    // const downloadUrl = `${secret.client_url}/api/v1/firmwares/${firmwareId}/download`;

    await new Promise<void>((resolve, reject) => {
      mqttClient.publish(
        firmwareTopic,
        downloadUrl,
        { qos: 1, retain: false },
        (err) => {
          if (err) {
            reject(err);
          }
          resolve();
        }
      );
      logger.info(`Firmware version sent`); // Log successful publish
    });
  } catch (error) {
    logger.error(`Failed to update firmaware`, error); // Log the error
    // throw createError(500, `MQTT publish to ${topic} failed .`);
  }
};

// Send a scheduled notice to a single device
const scheduleNotice = async (
  id: string,
  notice: string,
  startTime: number,
  endTime: number
) => {
  const device = await ClockDeviceModel.findById(id);
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
const scheduleNoticeToAllDevices = async (
  notice: string,
  startTime: number,
  endTime: number,
  deviceIds: string[]
) => {
  const devices = await ClockDeviceModel.find({
    _id: { $in: deviceIds },
  })
    .select("id")
    .lean();

  for (const device of devices) {
    // Schedule the notice for each device
    await scheduleNotice(device._id.toString(), notice, startTime, endTime);
  }
  return { message: `Scheduled notice sent to all devices.` };
};

// Get all scheduled notices
const getAllScheduledNotices = async () => {
  return ClockDeviceModel.find({}).select("id name scheduled_notices").lean();
};

// Get scheduled notices for a specific device
const getScheduledNoticesForDevice = async (id: string) => {
  const device = await ClockDeviceModel.findById(id).lean();
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
const cancelScheduledNotice = async (id: string, scheduledId: string) => {
  const device = await ClockDeviceModel.findById(id);
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
const createOrUpdateDevice = async (payload: Partial<IDevice>) => {
  const { id, ...updateData } = payload;

  const device = await ClockDeviceModel.findOneAndUpdate(
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
  emitDeviceStatusUpdate({ id: device.id });

  return device;
};

// Function to be called by the cron job to expire a notice
const expireNoticeById = async (id: string) => {
  try {
    const device = await ClockDeviceModel.findByIdAndUpdate(
      id,
      {
        mode: "clock",
        duration: null,
        end_time: null,
      },
      { new: true }
    )
      .select("id mac_id _id")
      .lean();

    if (device) {
      emitDeviceStatusUpdate({ id: device.id });
      // Publish an MQTT message to the device to change its mode
      await publishToDevice(device.mac_id, "mode", "0");
      logger.info(`Notice expired for device ${id}. Switched to clock mode.`);
    } else {
      logger.warn(`Device ${id} not found when trying to expire notice.`);
    }
  } catch (err) {
    logger.error(`Error expiring notice for device ${id}:`, err);
  }
};

// Function to be called by the cron job to send a scheduled notice
const sendScheduledNotice = async (id: string, scheduleId: string) => {
  try {
    const device = await ClockDeviceModel.findById(id).lean();

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

    if (device.status === "offline") {
      await ClockDeviceModel.findByIdAndUpdate(device._id, {
        pending_notice: true,
        notice,
        duration,
        $pull: { scheduled_notices: { id: scheduleId } },
      })
        .lean()
        .exec();

      return logger.info(
        `Device ${id} is offline. Scheduled notice set as pending.`
      );
    }

    // Publish the notice to the device
    await publishToDevice(device.mac_id, "notice", notice);
    await publishToDevice(device.mac_id, "mode", "1"); // Switch to notice mode

    // clear the scheduled notice from the device

    await ClockDeviceModel.findByIdAndUpdate(device._id, {
      $pull: { scheduled_notices: { id: scheduleId } },
    })
      .lean()
      .exec();

    logger.info(`Scheduled notice sent to device ${id}: "${notice}"`);

    // Now schedule the job to expire the notice after its duration
    scheduleExpireJob(id, duration);
  } catch (err) {
    logger.error(`Error sending scheduled notice for device ${id}:`, err);
  }
};

// Get all devices from the database
const getAllDevices = async (
  _id: Types.ObjectId,
  role: string,
  query: { mode?: string; status?: string; search?: string; type?: string }
) => {
  let devices: IDevice[] = [];

  const filter: {
    mode?: string;
    status?: string;
    type?: string;
    $or?: (
      | { name: { $regex: RegExp } }
      | { id: { $regex: RegExp } }
      | { mac_id: { $regex: RegExp } }
    )[];
  } = {};

  if (query.mode) {
    filter.mode = query.mode;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.type) {
    filter.type = query.type;
  }
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i"); // Case-insensitive regex
    filter.$or = [
      { name: { $regex: searchRegex } },
      { id: { $regex: searchRegex } },
      { mac_id: { $regex: searchRegex } },
    ];
  }

  // If the user is a superadmin, return all devices
  if (role === "superadmin") {
    devices = await ClockDeviceModel.find(filter).lean();
  } else {
    devices = await ClockDeviceModel.find({
      ...filter,
      allowed_users: {
        $in: _id,
      },
    }).lean();
  }

  return devices.map((device) => ({
    ...device,
    last_seen: dateFormat(device.last_seen),
    uptime: formatUptime(device.uptime),
    free_heap: formatBytes(device.free_heap),
  }));
};

// Get a single device by ID
const getDeviceById = async (id: string) => {
  const device = await ClockDeviceModel.findById(id).lean();

  if (!device) throw createError(404, `Device ${id} not found.`);

  const firmwares = await FirmwareModel.find({
    device_type: "clock",
    version: { $gt: device.firmware_version || "0.0.0" },
    status: "active",
  })
    .sort({ version: -1 })
    .lean();

  return {
    ...device,
    last_seen: dateFormat(device.last_seen),
    uptime: formatUptime(device.uptime),
    free_heap: formatBytes(device.free_heap),
    available_firmwares:
      firmwares.map((fw) => ({
        _id: fw._id,
        version: fw.version,
      })) || [],
  };
};

// Get all allowed access usrs for a device
const getAllowedUsersForDevice = async (id: string) => {
  const device = await ClockDeviceModel.findById(id)
    .select("group")
    .populate<{ allowed_users: IUser[] }>({
      // .populate<{ group: IGroup; allowed_users: IUser[] }>({
      path: "allowed_users",
      select: "_id first_name last_name email role",
      // path: "group",
      // select: "members",
      // populate: {
      //   path: "members",
      //   select: "_id first_name last_name email role",
      // },
    })
    .lean();

  if (!device) throw createError(404, `Device ${id} not found.`);

  // const deviceAllowedUsers = await UserModel.find({
  //   allowed_devices: {
  //     $in: [id],
  //   },
  // })
  //   .select("_id first_name last_name email role")
  //   .lean();

  // const groupAdmins =
  //   device.group?.members?.filter((u) => u.role === "admin") || [];

  // return [...deviceAllowedUsers, ...groupAdmins];
  return device.allowed_users.map((user) => ({
    _id: user._id.toString(),
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
  }));
};

// give device access to users in a group
const giveDeviceAccessToUsersInGroup = async (
  deviceId: string,
  userIds: string[]
) => {
  // Check if the users exist and are not already allowed access
  const users = await UserModel.find({
    _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
    // allowed_devices: { $ne: deviceId },
  }).lean();
  if (users.length === 0) {
    throw createError(404, "No valid users found to give device access.");
  }

  if (users.length !== userIds.length) {
    throw createError(404, "Some users not found.");
  }

  console.log(userIds);

  const device = await ClockDeviceModel.findByIdAndUpdate(
    deviceId,
    { $addToSet: { allowed_users: { $each: userIds } } },
    { new: true }
  ).lean();
  if (!device) throw createError(404, `Device ${deviceId} not found.`);

  console.log(device);

  // Update the users to give them access to the device

  // UserModel.updateMany(
  //   { _id: { $in: users.map((user) => user._id) } },
  //   { $addToSet: { allowed_devices: deviceId } }
  // ).exec();
};

// revokeDeviceAccessFromUser
const revokeDeviceAccessFromUser = async (deviceId: string, userId: string) => {
  const user = await UserModel.exists({
    _id: new mongoose.Types.ObjectId(userId),
  });
  if (!user) throw createError(404, `User ${userId} not found.`);

  const device = await ClockDeviceModel.findById(deviceId)
    .select("allowed_users")
    .lean();
  if (!device) throw createError(404, `Device ${deviceId} not found.`);
  // Check if the user exists and has access to the device

  if (!device.allowed_users?.toString().includes(userId)) {
    throw createError(
      404,
      `User ${userId} does not have access to device ${deviceId}.`
    );
  }

  // Remove the device from the user's allowed devices
  ClockDeviceModel.updateOne(
    { _id: device._id },
    { $pull: { allowed_users: new mongoose.Types.ObjectId(userId) } }
  ).exec();

  // const user = await UserModel.findOne({
  //   _id: new mongoose.Types.ObjectId(userId),
  //   allowed_devices: {
  //     $in: [deviceId],
  //   },
  // }).lean();
  // if (!user) {
  //   throw createError(
  //     404,
  //     `User ${userId} does not have access to device ${deviceId}.`
  //   );
  // }
  // Update the user to revoke access to the device
  // await UserModel.updateOne(
  //   { _id: user._id },
  //   { $pull: { allowed_devices: deviceId } }
  // ).exec();
};

// Change font and time format for a device
const changeDeviceFontAndTimeFormat = async (
  id: string,
  font?: string,
  timeFormat?: string
) => {
  const device = await ClockDeviceModel.findOne({ id });
  if (!device) throw createError(404, `Device ${id} not found.`);
  // Update the device with new font and time format
  console.log(font, timeFormat);

  return device;
};

// add device to group service
const addClockToGroup = async (
  groupId: string,
  deviceId: string,
  name: string,
  location: string
) => {
  // check device existence
  const device = await ClockDeviceModel.findOne({ id: deviceId });

  if (!device) {
    throw createError(404, "Device not found");
  }

  // check device already in another group
  const existingGroup = await GroupModel.exists({
    devices: {
      $in: [device._id],
    },
  });
  if (existingGroup) {
    throw createError(400, "Device already connected to group");
  }

  // Find the group and update its devices
  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $addToSet: {
        devices: {
          deviceId: device._id,
          deviceType: "clock",
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate<{ members: IUser[] }>("members", "role _id email")
    .select("-__v -createdAt -updatedAt");
  // .populate("members", "-password -__v");

  if (!group) {
    throw createError(404, "Group not found");
  }

  const adminId = group.members.find((member) => member.role === "admin")?._id;
  // name and location update
  device.name = name;
  device.location = location;
  device.last_seen = Date.now();
  device.group = new Types.ObjectId(groupId);

  device.allowed_users = adminId ? [adminId] : [];

  await device.save();

  return group;
};

const changeDeviceScene = async (id: string, scene: string) => {
  const device = await ClockDeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  await ClockDeviceModel.findByIdAndUpdate(device._id, { scene });

  const sceneValue = scene.split("scene")[1] || "0";

  await publishToDevice(device.mac_id, "scene", sceneValue);

  return {};
};

const startStopwatchInDevice = async (
  id: string,
  {
    start_time,
    end_time,
    mode,
    is_scheduled,
  }: {
    start_time: number;
    end_time: number;
    mode: "up" | "down";
    is_scheduled: boolean;
  }
) => {
  const device = await ClockDeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  await ClockDeviceModel.findByIdAndUpdate(device._id, {
    $push: { stopwatches: { start_time, end_time, mode } },
    mode: "stopwatch",
    last_seen: Date.now(),
  });

  if (is_scheduled) {
    const schedule = await Schedule.create({
      start_time,
      end_time,
      is_executed: false,
      category: {
        count_type: mode,
        device_id: device._id.toString(),
        schedule_id: new Types.ObjectId().toString(),
        for: "timer",
      },
    });

    // send 1 min before start time
    const fiveMinBefore = new Date(start_time - 0 * 60 * 1000);

    await agenda.schedule(fiveMinBefore, "start-schedule", {
      scheduleId: schedule._id,
    });
    await agenda.schedule(new Date(end_time), "end-schedule", {
      scheduleId: schedule._id,
    });
  } else {
    await publishToDevice(
      device.mac_id,
      "stopwatch",
      JSON.stringify({
        start_time,
        end_time,
        type: mode === "up" ? 2 : 1,
      })
    );
  }

  // await publishToDevice(device.mac_id, "mode", "2"); // Switch to stopwatch mode

  return {};
};

const stopStopwatchInDevice = async (id: string, stopWatchId: string) => {
  const device = await ClockDeviceModel.findById(id);
  if (!device) throw createError(404, `Device ${id} not found.`);

  await ClockDeviceModel.findByIdAndUpdate(device._id, {
    mode: "clock",
    last_seen: Date.now(),
    $pull: { stopwatches: { _id: stopWatchId } },
  });

  await publishToDevice(
    device.mac_id,
    "stopwatch",
    JSON.stringify({
      type: 0,
    })
  ); // Stop stopwatch
  await publishToDevice(device.mac_id, "mode", "0"); // Switch to clock mode

  return {};
};

const clockService = {
  stopStopwatchInDevice,
  startStopwatchInDevice,
  changeDeviceScene,
  addClockToGroup,
  updateDeviceStatusAndHandlePendingNotice,
  restartDeviceById,
  changeDeviceMode,
  changeAllDevicesMode,
  sendNoticeToDevice,
  sendNoticeToAllDevices,
  updateDeviceFirmware,
  scheduleNotice,
  scheduleNoticeToAllDevices,
  getAllScheduledNotices,
  getScheduledNoticesForDevice,
  cancelScheduledNotice,
  createOrUpdateDevice,
  expireNoticeById,
  sendScheduledNotice,
  getAllDevices,
  getDeviceById,
  getAllowedUsersForDevice,
  giveDeviceAccessToUsersInGroup,
  revokeDeviceAccessFromUser,
  changeDeviceFontAndTimeFormat,
  publishToDevice,
};

export default clockService;
