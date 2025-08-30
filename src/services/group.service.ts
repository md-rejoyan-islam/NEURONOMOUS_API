import createError from "http-errors";
import { Types } from "mongoose";
import { IDevice, IGroup, IUser } from "../app/types";
import { DeviceModel } from "../models/device.model";
import { GroupModel } from "../models/group.model";
import { UserModel } from "../models/user.model";
import { dateFormat, formatBytes, formatUptime } from "../utils/date-format";
import {
  changeDeviceModeService,
  sendNoticeToDeviceService,
} from "./device.service";

// get all groups service
export const getAllGroupsService = async (): Promise<IGroup[]> => {
  const groups = await GroupModel.find()
    .populate<{ devices: IDevice[] }>("devices", "-__v")
    .populate("members", "-password -__v")
    .lean();

  return groups;
};

// add user to group service
export const addUserToGroupService = async (
  groupId: string,
  userId: Types.ObjectId,
  role: "admin" | "superadmin" | "user",
  payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    deviceIds: Types.ObjectId[];
    phone?: string;
    notes?: string;
  }
): Promise<IGroup> => {
  // check user existence
  const user = await UserModel.exists({
    email: payload.email.toLowerCase(),
  });

  if (user) {
    throw createError(400, "Email already exists.");
  }

  // group check
  const group = await GroupModel.findById(groupId)
    .select("devices")
    .populate("members", "-password -__v");

  if (!group) {
    throw createError(404, "Group not found.");
  }

  if (
    role !== "superadmin" &&
    !group.members.some((member) => member._id !== userId)
  ) {
    throw createError.Unauthorized("You can't add user in another group.");
  }

  // device ids check
  payload.deviceIds.forEach((deviceId) => {
    if (!group.devices.includes(deviceId)) {
      throw createError(404, `Device with ID ${deviceId} not found in group`);
    }
  });

  // create new user
  const newUser = await UserModel.create({
    ...payload,
    email: payload.email.toLowerCase(),
    role: "user",
    group: groupId,
  });

  // give access to devices
  payload.deviceIds.forEach(async (deviceId) => {
    DeviceModel.findByIdAndUpdate(
      deviceId,
      {
        $addToSet: { allowed_users: newUser._id },
      },
      { new: true }
    ).exec();
  });

  // Find the group and update its members
  await group
    .updateOne(
      {
        $addToSet: { members: newUser._id },
      },
      {
        new: true,
        runValidators: true,
      }
    )
    .populate("members", "-password -__v");

  await group.save();

  //TODO: send email to user

  return group;
};

// get group by id service
export const getGroupByIdService = async (groupId: string) => {
  const group = await GroupModel.findById(groupId)
    .populate<{ devices: IDevice[] }>("devices", "-__v")
    .populate("members", "-password -__v")
    .lean();
  if (!group) {
    throw createError(404, "Group not found.");
  }
  return {
    ...group,
    devices: group?.devices?.map((device) => ({
      ...device,
      last_seen: dateFormat(device.last_seen),
      uptime: formatUptime(device.uptime),
      free_heap: formatBytes(device.free_heap),
    })),
  };
};

// update group by id service
export const updateGroupByIdService = async (
  groupId: string,
  payload: { name: string; description: string }
) => {
  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    { name: payload.name, description: payload.description },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("devices", "-__v")
    .populate("members", "-password -__v")
    .lean();
  if (!group) {
    throw createError(404, "Group not found.");
  }
  return group;
};

// add device to group service
export const addDeviceToGroupService = async (
  groupId: string,
  deviceId: string,
  name: string,
  location: string
): Promise<IGroup> => {
  // check device existence
  const device = await DeviceModel.findOne({ id: deviceId });

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
      $addToSet: { devices: device._id },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate<{ members: IUser[] }>("members", "role _id email")
    .select("-__v -members -createdAt -updatedAt");
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

// remove device from group service
export const removeDeviceFromGroupService = async (
  groupId: string,
  deviceId: string
): Promise<IGroup> => {
  // remove from group
  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    { $pull: { devices: deviceId } },
    { new: true }
  ).lean();

  if (!group) {
    throw createError(404, "Group not found.");
  }

  // remove group reference from device
  DeviceModel.findByIdAndUpdate(
    deviceId,
    {
      $set: { group: null, allowed_users: [] },
    },
    { new: true, runValidators: true }
  ).exec();

  return group;
};

// bulk change group devices mode service
export const bulkChangeGroupDevicesModeService = async (
  groupId: string,
  payload: {
    mode: "clock" | "notice";
    deviceIds: Types.ObjectId[];
  }
): Promise<IGroup> => {
  const group = await GroupModel.findById(groupId)
    .populate<{ devices: IDevice[] }>("devices", "-__v")
    .lean();

  if (!group) throw createError(404, "Group not found.");

  // check deviceIds existence in group
  const devicesNotInGroup = payload.deviceIds.filter(
    (deviceId) =>
      !group.devices.some(
        (device) => device._id.toString() === deviceId.toString()
      )
  );
  if (devicesNotInGroup.length > 0) {
    throw createError(
      400,
      `Devices not found in group: ${devicesNotInGroup.join(", ")}`
    );
  }

  // const devices = await DeviceModel.find({
  //   _id: { $in: group.devices },
  // }).lean();

  for (const device of group.devices) {
    if (device.status === "online") {
      changeDeviceModeService(device.id, payload.mode);
    }
  }
  await DeviceModel.updateMany(
    {
      status: "online",
    },
    { mode: payload.mode }
  );

  return group;
};

// bulk change group devices notice service
export const bulkChangeGroupDevicesNoticeService = async (
  groupId: string,
  payload: {
    notice: string;
    deviceIds: Types.ObjectId[];
  }
): Promise<IGroup> => {
  // notice change logic

  console.log("Notice change payload:", payload);

  // Find the group and update its devices
  const group = await GroupModel.findById(groupId).lean();

  if (!group) {
    throw createError(404, "Group not found");
  }

  return group;
};

// get all users in group service
export const getAllUsersInGroupService = async (
  groupId: string
): Promise<IGroup> => {
  // Find the group and populate its members
  const group = await GroupModel.findById(groupId)
    .populate("members", "-password -__v")
    .lean();

  if (!group) {
    throw createError(404, "Group not found");
  }

  return group;
};

// get all devices in group service
export const getAllDevicesInGroupService = async (
  groupId: string
): Promise<IDevice[]> => {
  // Find the group and populate its devices
  const group = await GroupModel.findById(groupId)
    .populate<{ devices: IDevice[] }>("devices", "-__v")
    .lean();
  if (!group) {
    throw createError(404, "Group not found");
  }
  return group.devices;
};

// Show notice on all devices In a group
export const sendNoticeToAllDevicesServiceInGroup = async (
  groupId: string,
  notice: string,
  duration: number | null
) => {
  const group = await GroupModel.findById(groupId)
    .populate("devices", "-__v")
    .lean();
  if (!group) throw createError(404, "Group not found.");

  const devices = await DeviceModel.find({
    _id: { $in: group.devices },
  }).lean();

  for (const device of devices) {
    // if (device.status === "online") {
    sendNoticeToDeviceService(device.id, notice, duration);
    // }
  }
  return { message: `Notice sent to all online devices.` };
};
