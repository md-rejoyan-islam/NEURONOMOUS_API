import createError from "http-errors";
import { Types } from "mongoose";
import { IGroup, IUser } from "../../app/types";
import { CourseModel } from "../../models/course.model";
import { AttendanceDeviceModel } from "../../models/devices/attendance.model";
import { FirmwareModel } from "../../models/firmware.model";
import { GroupModel } from "../../models/group.model";

const getAllAttendanceDevices = async () => {
  const devices = await AttendanceDeviceModel.find()
    .select("-__v -createdAt -updatedAt")
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

const getAttendanceDeviceById = async (deviceId: string) => {
  const existDevice = await AttendanceDeviceModel.exists({ _id: deviceId });
  if (!existDevice) {
    throw createError(404, "Device not found");
  }

  const device = await AttendanceDeviceModel.findById(deviceId)
    .select("-__v -createdAt -updatedAt")
    .populate<{
      group: IGroup;
    }>("group", "name description eiin")
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

  const instructorId = device?.allowed_users?.find(
    (user) => user.role !== "admin"
  )?._id;

  const courses = await CourseModel.find({
    instructor: instructorId,
  })
    .populate<{
      course: {
        _id: Types.ObjectId;
        name: string;
        code: string;
      };
    }>("course", "name code department")
    .lean();

  const firmwares = await FirmwareModel.find({
    device_type: "attendance",
    version: { $gt: device?.firmware_version || "0.0.0" },
    status: "active",
  })
    .sort({ version: -1 })
    .lean();

  return {
    ...device,
    available_firmwares:
      firmwares.map((fw) => ({
        _id: fw._id,
        version: fw.version,
      })) || [],
    courses: courses.map((course) => ({
      _id: course._id,
      code: course.course.code,
      name: course.course.name,
      session: course.session,
      department: course.department,
      instructor: course.instructor,
      enroll_link: course.enroll_link,
      updatedAt: course.updatedAt,
      studentsEnrolled: course.enrolled_students.length || 0,
      completedClasses: course.records.length || 0,
    })),
  };
};

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
      $addToSet: {
        devices: {
          deviceId: device._id,
          deviceType: "attendance",
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

const attendanceDeviceService = {
  getAllAttendanceDevices,
  getAttendanceDeviceById,
  addAttendanceDeviceToGroup,
};

export default attendanceDeviceService;
