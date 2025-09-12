import createError from "http-errors";
import { Types } from "mongoose";
import { IAttendanceDevice, IDevice, IGroup, IUser } from "../app/types";
import { AttendanceDeviceModel } from "../models/devices/attendance.model";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { GroupModel } from "../models/group.model";
import { UserModel } from "../models/user.model";
import { dateFormat, formatBytes, formatUptime } from "../utils/date-format";
import clockService from "./devices/clock.service";

// get all groups service
const getAllGroups = async ({
  name,
  eiin,
  page,
  limit,
  sortBy,
  search,
  order,
}: {
  name?: string;
  eiin?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  order: 1 | -1;
}) => {
  const query: {
    name?: { $regex: string; $options: string };
    eiin?: string;
    $or?: (
      | { name: { $regex: string; $options: string } }
      | { eiin: { $regex: string; $options: string } }
    )[];
  } = {};

  if (name) {
    query.name = { $regex: name, $options: "i" };
  }
  if (eiin) {
    query.eiin = eiin;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { eiin: { $regex: search, $options: "i" } },
    ];
  }

  const groups = await GroupModel.find(query)
    .sort({ [sortBy]: order })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate<{
      devices: {
        deviceId: IDevice | IAttendanceDevice;
        deviceType: "clock" | "attendance";
      }[];
    }>("devices.deviceId", "-__v")
    .populate("members", "-password -__v")
    .lean();

  const total = await GroupModel.countDocuments(query);

  const pagination = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return {
    groups: groups.map((group) => ({
      name: group.name,
      _id: group._id,
      eiin: group.eiin,
      description: group.description,
      createdAt: group.createdAt,
      clock: group?.devices?.filter((device) => device.deviceType === "clock")
        .length,
      attendance: group?.devices?.filter(
        (device) => device.deviceType === "attendance"
      ).length,
      users: group?.members.length,
    })),
    pagination,
  };
};
// get all groups service for courser
const getAllGroupsForCourse = async () => {
  const groups = await GroupModel.find().select("name eiin").lean();

  return groups;
};

// add user to group service
const addUserToGroup = async (
  groupId: string,
  userId: Types.ObjectId,
  role: "admin" | "superadmin" | "user",
  payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    deviceIds: Types.ObjectId[];
    deviceType: "clock" | "attendance";
    phone?: string;
    notes?: string;
  }
) => {
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
    if (
      !group.devices.some((device) => ({
        deviceId: device.deviceId,
        deviceType: payload.deviceType === "clock" ? "clock" : "attendance",
      }))
      // !group.devices.includes({
      //   deviceId,
      //   deviceType: payload.deviceType === "clock" ? "clock" : "attendance",
      // })
    ) {
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
    if (payload.deviceType === "clock") {
      ClockDeviceModel.findByIdAndUpdate(
        deviceId,
        {
          $addToSet: { allowed_users: newUser._id },
        },
        { new: true }
      ).exec();
    } else if (payload.deviceType === "attendance") {
      AttendanceDeviceModel.findByIdAndUpdate(
        deviceId,
        {
          $addToSet: { allowed_users: newUser._id },
        },
        { new: true }
      ).exec();
    }
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
const getGroupById = async (groupId: string) => {
  const group = await GroupModel.findById(groupId)
    .populate<{
      devices: {
        deviceId: IDevice;
        deviceType: "clock" | "attendance";
      }[];
    }>("devices.deviceId", "-__v")
    .populate("members", "-password -__v")
    .lean();
  if (!group) {
    throw createError(404, "Group not found.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clocks = group.devices.reduce<any[]>(
    (acc, { deviceType, deviceId }) => {
      if (deviceType === "clock") {
        acc.push({
          ...deviceId,
          last_seen: dateFormat(deviceId.last_seen),
          uptime: formatUptime(deviceId.uptime),
          free_heap: formatBytes(deviceId.free_heap),
        });
      }
      return acc;
    },
    []
  );

  const attendance = group.devices.filter(
    (device) => device.deviceType === "attendance"
  );

  // delete devices

  return {
    name: group.name,
    _id: group._id,
    eiin: group.eiin,
    description: group.description,
    createdAt: dateFormat(group.createdAt),
    members: group.members,
    clock: clocks,
    attendance,
  };
};

const deleteGroupById = async (groupId: string) => {
  const group = await GroupModel.findByIdAndDelete(groupId).lean();
  if (!group) {
    throw createError(404, "Group not found.");
  }

  // remove group reference from devices
  await ClockDeviceModel.updateMany(
    { _id: { $in: group.devices } },
    {
      $set: {
        group: null,
        allowed_users: [],
        name: null,
        location: null,
        last_seen: Date.now(),
      },
    },
    { runValidators: true }
  ).exec();

  await AttendanceDeviceModel.updateMany(
    { _id: { $in: group.devices } },
    { $set: { group: null, allowed_users: [] } },
    { runValidators: true }
  ).exec();

  // delete all users in the group
  await UserModel.deleteMany({ _id: { $in: group.members } }).exec();

  return group;
};

// update group by id service
const updateGroupById = async (
  groupId: string,
  payload: { name: string; description: string; eiin: string }
) => {
  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    {
      ...payload,
    },
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
const addDeviceToGroup = async (
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
// add attendance device to group service
const addAttendanceDeviceToGroup = async (
  groupId: string,
  deviceId: string
) => {
  // check device existence
  const device = await AttendanceDeviceModel.findOne({ id: deviceId });

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
    .select("-__v -createdAt -updatedAt");
  // .populate("members", "-password -__v");

  if (!group) {
    throw createError(404, "Group not found");
  }
  // console.log(group);

  const adminId = group.members.find((member) => member.role === "admin")?._id;

  // // name and location update
  // device.name = name;
  // device.location = location;
  device.last_seen = Date.now();
  device.group = new Types.ObjectId(groupId);

  device.allowed_users = adminId ? [adminId] : [];

  await device.save();

  return group;
};

// remove device from group service
const removeDeviceFromGroup = async (
  groupId: string,
  deviceId: string
): Promise<IGroup> => {
  // remove from group
  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $pull: {
        devices: {
          deviceId: new Types.ObjectId(deviceId),
        },
      },
    },
    { new: true }
  ).lean();

  if (!group) {
    throw createError(404, "Group not found.");
  }

  // remove group reference from device
  ClockDeviceModel.findByIdAndUpdate(
    deviceId,
    {
      $set: { group: null, allowed_users: [] },
    },
    { new: true, runValidators: true }
  ).exec();

  return group;
};

// bulk change group devices mode service
const bulkChangeGroupDevicesMode = async (
  groupId: string,
  payload: {
    mode: "clock" | "notice";
    deviceIds: Types.ObjectId[];
  }
): Promise<IGroup> => {
  const group = await GroupModel.findById(groupId)
    .populate<{
      devices: {
        deviceId: IDevice;
        deviceType: "clock";
      }[];
    }>("devices.deviceId", "-__v")
    .lean();

  if (!group) throw createError(404, "Group not found.");

  // check deviceIds existence in group
  const devicesNotInGroup = payload.deviceIds.filter(
    (deviceId) =>
      !group.devices.some(
        (device) => device.deviceId._id.toString() === deviceId.toString()
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
    if (device.deviceId.status === "online") {
      clockService.changeDeviceMode(device.deviceId.id, payload.mode);
    }
  }
  await ClockDeviceModel.updateMany(
    {
      status: "online",
    },
    { mode: payload.mode }
  );

  return group;
};

// bulk change group devices notice service
const bulkChangeGroupDevicesNotice = async (
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
const getAllUsersInGroup = async (groupId: string): Promise<IGroup> => {
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
const getAllDevicesInGroup = async (groupId: string): Promise<IDevice[]> => {
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
const sendNoticeToAllDevicesServiceInGroup = async (
  groupId: string,
  notice: string,
  duration: number | null
) => {
  const group = await GroupModel.findById(groupId)
    .populate("devices", "-__v")
    .lean();
  if (!group) throw createError(404, "Group not found.");

  const devices = await ClockDeviceModel.find({
    _id: { $in: group.devices },
  }).lean();

  for (const device of devices) {
    // if (device.status === "online") {
    clockService.sendNoticeToDevice(device.id, notice, duration);
    // }
  }
  return { message: `Notice sent to all online devices.` };
};

const getGroupByIdWithClocks = async (
  groupId: string,
  {
    search,
  }: {
    search?: string;
  }
) => {
  const group = await ClockDeviceModel.find({
    group: groupId,
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { id: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  })
    .select("-__v -createdAt -updatedAt")
    .lean();

  console.log("Clock Devices:", group);

  if (!group) {
    throw createError(404, "Group not found.");
  }

  return group;
};

const getGroupByIdWithAttendanceDevices = async (
  groupId: string,
  { search }: { search?: string }
) => {
  const devices = await AttendanceDeviceModel.find({
    group: groupId,
    ...(search
      ? {
          $or: [
            // { name: { $regex: search, $options: "i" } },
            // { location: { $regex: search, $options: "i" } },
            { id: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  })
    .populate<{
      group: {
        _id: Types.ObjectId;
        name: string;
        members: {
          email: string;
          role: string;
          first_name: string;
          last_name: string;
        }[];
      } | null;
    }>({
      path: "group",
      select: "name location",
      populate: {
        path: "members",
        select: "email role first_name last_name",
      },
    })
    .populate<{
      allowed_users: {
        _id: Types.ObjectId;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
      }[];
    }>("allowed_users", "first_name last_name email role")
    .lean();

  if (!devices.length) {
    throw createError(404, "Group not found.");
  }

  return devices?.map((device) => ({
    ...device,
    allowed_users: device?.allowed_users?.filter(
      (user) => user.role !== "admin"
    ),
    group: device.group
      ? {
          _id: device.group._id,
          name: device.group.name,
          admin: device.group.members.find((member) => member.role === "admin"),
          members: device.group.members.filter(
            (member) => member.role !== "admin"
          ),
        }
      : null,
  }));
};

const groupService = {
  getGroupByIdWithAttendanceDevices,
  getGroupByIdWithClocks,
  getAllGroups,
  addUserToGroup,
  getGroupById,
  deleteGroupById,
  updateGroupById,
  addDeviceToGroup,
  removeDeviceFromGroup,
  bulkChangeGroupDevicesMode,
  bulkChangeGroupDevicesNotice,
  getAllUsersInGroup,
  getAllDevicesInGroup,
  sendNoticeToAllDevicesServiceInGroup,
  addAttendanceDeviceToGroup,
  getAllGroupsForCourse,
};

export default groupService;
