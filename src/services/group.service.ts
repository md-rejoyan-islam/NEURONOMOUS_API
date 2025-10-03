import createError from "http-errors";
import mongoose, { Types } from "mongoose";
import {
  IAttendanceDevice,
  IDevice,
  IGroup,
  IPagination,
  IUser,
} from "../app/types";
import { DepartmentCourseModel } from "../models/department-course.model";
import { AttendanceDeviceModel } from "../models/devices/attendance.model";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { GroupModel } from "../models/group.model";
import StudentModel from "../models/student.model";
import { UserModel } from "../models/user.model";
import { dateFormat, formatBytes } from "../utils/_date-format";
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

  const pagination: IPagination = {
    items: total,
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
  role: "admin" | "superadmin" | "user",
  userId: Types.ObjectId,
  payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
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
  const group = await GroupModel.findById(groupId).populate(
    "members",
    "-password -__v"
  );

  if (!group) {
    throw createError(404, "Group not found.");
  }

  if (
    role !== "superadmin" &&
    !group.members.some((member) => member._id !== userId)
  ) {
    throw createError.Unauthorized("You can't add user in another group.");
  }

  // create new user
  const newUser = await UserModel.create({
    ...payload,
    email: payload.email.toLowerCase(),
    role: "user",
    group: groupId,
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
// add user to group service
const addUserToGroupWithDevices = async (
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

// add user to group service
const giveDevicesPermissionToUser = async (
  groupId: string,
  _id: Types.ObjectId,
  role: "admin" | "superadmin" | "user",
  payload: {
    userId: Types.ObjectId;
    deviceIds: Types.ObjectId[];
    deviceType: "clock" | "attendance";
  }
) => {
  // check user existence
  const user = await UserModel.exists({
    _id: payload.userId,
  });

  if (!user) {
    throw createError(400, "User not found.");
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
    !group.members.some((member) => member._id !== _id)
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
    ) {
      throw createError(404, `Device with ID ${deviceId} not found in group`);
    }
  });

  // give access to devices
  payload.deviceIds.forEach(async (deviceId) => {
    if (payload.deviceType === "clock") {
      ClockDeviceModel.findByIdAndUpdate(
        deviceId,
        {
          $addToSet: { allowed_users: payload.userId },
        },
        { new: true }
      ).exec();
    } else if (payload.deviceType === "attendance") {
      AttendanceDeviceModel.findByIdAndUpdate(
        deviceId,
        {
          $addToSet: { allowed_users: payload.userId },
        },
        { new: true }
      ).exec();
    }
  });

  // Find the group and update its members
  await group
    .updateOne(
      {
        $addToSet: { members: payload.userId },
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
          free_heap: formatBytes(deviceId.free_heap),
        });
      }
      return acc;
    },
    []
  );

  const students = await StudentModel.countDocuments({ department: groupId });
  const courses = await DepartmentCourseModel.countDocuments({
    department: groupId,
  });

  const attendance = group.devices.filter(
    (device) => device.deviceType === "attendance"
  );
  const devices = group.devices.length || 0;

  return {
    name: group.name,
    _id: group._id,
    eiin: group.eiin,
    description: group.description,
    createdAt: dateFormat(group.createdAt),
    members: group.members,
    devices,
    courses,
    students,
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

export const getAllUsersInGroup = async ({
  groupId,
  page = 1,
  limit = 10,
  search = "",
}: {
  groupId: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const skip = (page - 1) * limit;

  const group = await GroupModel.findById(groupId)
    .populate<{ members: IUser[] }>("members", "first_name last_name email")
    .lean();

  if (!group) {
    throw createError(404, "Group not found");
  }

  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: { _id: new mongoose.Types.ObjectId(groupId) },
    },
    {
      $lookup: {
        from: "users", // collection name of members
        localField: "members",
        foreignField: "_id",
        as: "members",
        pipeline: [
          {
            $match: {
              $or: [
                { first_name: { $regex: search, $options: "i" } },
                { last_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
              ],
            },
          },
          { $project: { password: 0, __v: 0 } },
          { $skip: skip },
          { $limit: limit },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        members: 1,
      },
    },
  ];

  const groups = await GroupModel.aggregate(pipeline);

  const items =
    group.members.filter((member) => {
      return (
        member.first_name.toLowerCase().includes(search.toLowerCase()) ||
        member.last_name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
      );
    }).length || 0;

  const pagination: IPagination = {
    items,
    page: page,
    limit: limit,
    totalPages: Math.ceil(items / limit),
  };

  return {
    name: group?.name,
    _id: group?._id,
    eiin: group?.eiin,
    description: group?.description,
    createdAt: group?.createdAt,
    pagination,
    members: groups[0]?.members || [],
  };
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

  console.log(devices, notice, duration);

  // for (const device of devices) {
  //   // if (device.status === "online") {
  //   // clockService.sendNoticeToDevice(device.id, notice, duration);
  //   // }
  // }
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
  const clocks = await ClockDeviceModel.find({
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

  return clocks || [];
};

const getGroupByIdWithAttendanceDevices = async (
  groupId: string,
  { search }: { search?: string }
) => {
  const devices = await AttendanceDeviceModel.find({
    group: groupId,
    ...(search
      ? {
          $or: [{ id: { $regex: search, $options: "i" } }],
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

  return (
    devices?.map((device) => ({
      ...device,
      allowed_users: device?.allowed_users?.filter(
        (user) => user.role !== "admin"
      ),
      group: device.group
        ? {
            _id: device.group._id,
            name: device.group.name,
            admin: device.group.members.find(
              (member) => member.role === "admin"
            ),
            members: device.group.members.filter(
              (member) => member.role !== "admin"
            ),
          }
        : null,
    })) || []
  );
};

const createCourseForDepartment = async ({
  code,
  name,
  groupId,
}: {
  code: string;
  name: string;
  groupId: string;
}) => {
  // check if department with the given eiin exists
  const departmentExists = await GroupModel.exists({
    _id: groupId,
  });
  if (!departmentExists) {
    throw new Error("Department with the given ID not found.");
  }

  // check if course with the given code already exists in the department

  const courseExists = await DepartmentCourseModel.exists({
    department: groupId,
    code,
  });

  if (courseExists) {
    throw new Error(
      "Course with the given code already exists in the department."
    );
  }

  await DepartmentCourseModel.create({
    name,
    code,
    department: new Types.ObjectId(groupId),
  });

  // To be implemented
  return {};
};

const editCourseInDepartment = async ({
  groupId,
  courseId,
  name,
  code,
}: {
  groupId: string;
  courseId: string;
  name: string;
  code: string;
}) => {
  const group = await GroupModel.findOne({
    _id: groupId,
  });
  if (!group) {
    throw new Error("Department with the given ID not found.");
  }

  const courseExists = await DepartmentCourseModel.exists({
    department: groupId,
    _id: courseId,
  });

  if (!courseExists) {
    throw new Error("Course with the given ID not found in the department.");
  }
  await DepartmentCourseModel.updateOne(
    { department: groupId, _id: courseId },
    { name, code }
  );

  return {};
};

const removeCourseFromDepartment = async (
  groupId: string,
  courseId: string
) => {
  // check if department with the given eiin exists
  const departmentExists = await GroupModel.exists({
    _id: groupId,
  });
  if (!departmentExists) {
    throw new Error("Department with the given ID not found.");
  }

  const course = await DepartmentCourseModel.findOneAndDelete({
    department: groupId,
    _id: courseId,
  });

  if (!course) {
    throw new Error("Course with the given ID not found in the department.");
  }

  // To be implemented
  return {};
};

// get department courses service
const getDepartmentCourses = async ({
  groupId,
  search,
  page,
  limit,
}: {
  groupId: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  const skip = (page - 1) * limit;

  const group = await GroupModel.findById(groupId)
    .select("name eiin description createdAt courses")
    .lean();

  if (!group) {
    throw createError(404, "Group not found.");
  }

  // const pipeline: mongoose.PipelineStage[] = [
  //   { $match: { _id: new mongoose.Types.ObjectId(groupId) } },
  //   {
  //     $project: { courses: 1 },
  //   },
  //   { $unwind: "$courses" },
  //   ...(search
  //     ? [
  //         {
  //           $match: {
  //             $or: [
  //               { "courses.name": { $regex: search, $options: "i" } },
  //               { "courses.code": { $regex: search, $options: "i" } },
  //             ],
  //           },
  //         },
  //       ]
  //     : []),
  //   { $skip: skip },
  //   { $limit: limit },
  //   {
  //     $group: {
  //       _id: "$_id",
  //       courses: { $push: "$courses" },
  //     },
  //   },
  // ];

  // const groups = await GroupModel.aggregate(pipeline).exec();

  const courses = await DepartmentCourseModel.find({
    department: groupId,
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await DepartmentCourseModel.countDocuments({
    department: groupId,
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  });

  const pagination: IPagination = {
    items: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return {
    name: group.name,
    _id: group._id,
    eiin: group.eiin,
    description: group.description,
    createdAt: group.createdAt,
    pagination,
    courses: courses,
  };
};

// create students for department
const createStudentsForDepartment = async (
  groupId: string,
  payload: {
    name: string;
    email: string;
    session: string;
    registration_number: string;
    rfid: string;
    phone?: string;
  }[]
) => {
  const group = await GroupModel.exists({ _id: groupId });
  if (!group) {
    throw createError(404, "Group not found.");
  }

  // check if student with the given email, registration_number or rfid already exists in the department
  for (const student of payload) {
    const studentExists = await StudentModel.exists({
      department: groupId,
      $or: [
        { email: student.email },
        { registration_number: student.registration_number },
        { rfid: student.rfid },
      ],
    });

    if (studentExists) {
      throw createError(
        400,
        `Student with email ${student.email}, registration number ${student.registration_number} or RFID ${student.rfid} already exists in the department.`
      );
    }
  }

  // add students to department
  await StudentModel.insertMany(
    payload.map((student) => ({
      ...student,
      department: groupId,
    }))
  );

  return group;
};
// update student information in department
const editStudentInDepartment = async (
  groupId: string,
  studentId: string,
  payload: {
    name: string;
    email: string;
    session: string;
    registration_number: string;
    rfid: string;
  }
) => {
  const group = await GroupModel.exists({
    _id: groupId,
  });
  if (!group) {
    throw createError(404, "Group not found.");
  }

  // check if student with the given email, registration_number or rfid already exists in the department
  const studentExists = await StudentModel.exists({
    department: groupId,
    _id: { $ne: studentId },
    $or: [
      { email: payload.email },
      { registration_number: payload.registration_number },
      { rfid: payload.rfid },
    ],
  });

  if (studentExists) {
    throw createError(
      400,
      `Student with email ${payload.email}, registration number ${payload.registration_number} or RFID ${payload.rfid} already exists in the department.`
    );
  }

  await StudentModel.findOneAndUpdate(
    {
      department: groupId,
      _id: studentId,
    },
    {
      ...payload,
    }
  );
  return {};
};
// remove students from department
const deleteStudentFromDepartment = async (
  groupId: string,
  studentId: string
) => {
  const group = await GroupModel.exists({
    _id: groupId,
  });
  if (!group) {
    throw createError(404, "Group not found.");
  }

  await StudentModel.findOneAndDelete({
    department: groupId,
    _id: studentId,
  });

  return {};
};
// get all students in department
const getAllStudentsInDepartment = async ({
  groupId,
  search,
  page,
  limit,
}: {
  groupId: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  const skip = (page - 1) * limit;
  // const group = await GroupModel.findOne(
  //   {
  //     _id: groupId,
  //     ...(search
  //       ? {
  //           $or: [
  //             { "students.name": { $regex: search, $options: "i" } },
  //             { "students.email": { $regex: search, $options: "i" } },
  //             { "students.session": { $regex: search, $options: "i" } },
  //             {
  //               "students.registration_number": {
  //                 $regex: search,
  //                 $options: "i",
  //               },
  //             },
  //             { "students.rfid": { $regex: search, $options: "i" } },
  //           ],
  //         }
  //       : {}),
  //   },
  //   {
  //     students: search
  //       ? {
  //           $elemMatch: {
  //             $or: [
  //               { name: { $regex: search, $options: "i" } },
  //               { email: { $regex: search, $options: "i" } },
  //               { session: { $regex: search, $options: "i" } },
  //               { registration_number: { $regex: search, $options: "i" } },
  //               { rfid: { $regex: search, $options: "i" } },
  //             ],
  //           },
  //         }
  //       : 1,
  //   }
  // )
  //   .select("name eiin description createdAt students")
  //   .lean();

  const groupExists = await GroupModel.findById(groupId).lean();
  if (!groupExists) {
    throw createError(404, "Group not found.");
  }

  const students = await StudentModel.find({
    department: groupId,
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { session: { $regex: search, $options: "i" } },
            { registration_number: { $regex: search, $options: "i" } },
            { rfid: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await StudentModel.countDocuments({
    department: groupId,
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { session: { $regex: search, $options: "i" } },
            { registration_number: { $regex: search, $options: "i" } },
            { rfid: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  });

  // const groups = await GroupModel.aggregate([
  //   { $match: { _id: new Types.ObjectId(groupId) } },
  //   { $unwind: "$students" },
  //   {
  //     $match: {
  //       $or: [
  //         { $expr: { $eq: [search || "", ""] } },
  //         { "students.name": { $regex: search, $options: "i" } },
  //         { "students.email": { $regex: search, $options: "i" } },
  //         { "students.session": { $regex: search, $options: "i" } },
  //         { "students.registration_number": { $regex: search, $options: "i" } },
  //         { "students.rfid": { $regex: search, $options: "i" } },
  //       ],
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: "$_id",
  //       name: { $first: "$name" },
  //       eiin: { $first: "$eiin" },
  //       description: { $first: "$description" },
  //       createdAt: { $first: "$createdAt" },
  //       students: { $push: "$students" },
  //     },
  //   },
  //   {
  //     $addFields: { totalStudents: { $size: "$students" } },
  //   },
  //   {
  //     $project: {
  //       name: 1,
  //       eiin: 1,
  //       description: 1,
  //       createdAt: 1,
  //       totalStudents: 1,
  //       students: { $slice: ["$students", skip, limit] },
  //     },
  //   },
  // ]);

  // const group = groups[0];

  // const total = group?.totalStudents || 0;

  const pagination: IPagination = {
    items: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return {
    pagination,
    name: groupExists.name,
    _id: groupExists._id,
    eiin: groupExists.eiin,
    description: groupExists.description,
    createdAt: groupExists.createdAt,
    students: students || [],
  };
};

const groupService = {
  giveDevicesPermissionToUser,
  getDepartmentCourses,
  removeCourseFromDepartment,
  createCourseForDepartment,
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
  editCourseInDepartment,
  addUserToGroupWithDevices,
  createStudentsForDepartment,
  editStudentInDepartment,
  deleteStudentFromDepartment,
  getAllStudentsInDepartment,
};

export default groupService;
