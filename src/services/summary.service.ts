import createError from "http-errors";
import { Types } from "mongoose";
import os from "os";
import si from "systeminformation";
import { AttendanceDeviceModel } from "../models/devices/attendance.model";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { GroupModel } from "../models/group.model";
import StudentModel from "../models/student.model";
import { UserModel } from "../models/user.model";

const getMemoryDetails = () => {
  const total = os.totalmem();

  const free = os.freemem();

  const used = total - free;
  const memoryUsagePercent = (used / total) * 100;

  return {
    total,
    free,
    used,
    memoryUsagePercent: memoryUsagePercent.toFixed(2), // %
  };
};

const getCpuDetails = async () => {
  const cpu = await si.currentLoad(); // CPU load info

  const cores = os.cpus().length;
  const cpuUsagePercent = cpu.currentLoad;
  return {
    cores,
    cpuUsagePercent: cpuUsagePercent.toFixed(2),
  };
};

const dashboardPageSummary = async ({ _id }: { _id: Types.ObjectId }) => {
  const user = await UserModel.findById(_id)
    .select("first_name last_name email role group")
    .lean();

  if (!user) {
    throw createError(404, "User not found");
  }

  if (user.role === "superadmin") {
    const totalClockDevices = await ClockDeviceModel.countDocuments().lean();
    const totalAttendanceDevices =
      await AttendanceDeviceModel.countDocuments().lean();
    const totalUsers = await UserModel.countDocuments().lean();
    const totalGroups = await GroupModel.countDocuments().lean();
    const totalStudents = await StudentModel.countDocuments().lean();
    return {
      _id,
      role: user?.role,
      first_name: user?.first_name,
      last_name: user?.last_name,
      email: user?.email,
      totalClockDevices,
      totalAttendanceDevices,
      totalGroups,
      totalUsers,
      totalStudents,
      cpu: {
        ...(await getCpuDetails()),
      },
      memory: {
        ...getMemoryDetails(),
      },
    };
  } else if (user.role === "admin" && user.group) {
    const totalStudents = await StudentModel.countDocuments({
      department: user.group,
    }).lean();

    const group = await GroupModel.findById(user.group).lean();

    const clockDevices =
      group?.devices?.filter((device) => device.deviceType === "clock") || [];

    return {
      _id,
      role: user?.role,
      first_name: user?.first_name,
      last_name: user?.last_name,
      email: user?.email,
      totalClockDevices: clockDevices.length || 0,
      totalAttendanceDevices:
        (group?.devices.length || 0) - (clockDevices.length || 0) || 0,
      totalUsers: group?.members.length || 0,
      totalStudents,
    };
  } else if (user.role === "user" && user.group) {
    const group = await GroupModel.findById(user.group).lean();
    const clockDevices = await ClockDeviceModel.find({
      allowed_users: user._id,
    }).lean();
    const attendanceDevices = await AttendanceDeviceModel.find({
      allowed_users: user._id,
    }).lean();
    return {
      _id,
      role: user?.role,
      first_name: user?.first_name,
      last_name: user?.last_name,
      email: user?.email,
      totalClockDevices: clockDevices.length || 0,
      totalAttendanceDevices: attendanceDevices.length || 0,
      totalUsers: group?.members.length || 0,
    };
  }

  return null;
};

export const downloadClockDevicesSummary = async () => {
  const clockDevices = await ClockDeviceModel.find().lean();

  const headers =
    ["#", "id", "mac_id", "type", "firmware_version", "name", "location"].join(
      ","
    ) + "\n";

  const rows = clockDevices
    .map((device, index) =>
      [
        index + 1,
        device._id,
        device.mac_id,
        device.type,
        device.firmware_version,
        device.name,
        device.location,
      ].join(",")
    )
    .join("\n");

  const csv = headers + rows;

  return csv;
};

export const downloadAttendanceDevicesSummary = async () => {
  const attendanceDevices = await AttendanceDeviceModel.find().lean();
  const headers = ["#", "id", "mac_id", "firmware_version"].join(",") + "\n";
  const rows = attendanceDevices
    .map((device, index) =>
      [index + 1, device._id, device.mac_id, device.firmware_version].join(",")
    )
    .join("\n");

  const csv = headers + rows;

  return csv;
};

export const downloadStudentsSummary = async () => {
  const students = await StudentModel.find().lean();
  const headers =
    [
      "#",
      "registration_number",
      "name",
      "session",
      "phone",
      "email",
      "department",
    ].join(",") + "\n";
  const rows = students
    .map((student, index) =>
      [
        index + 1,
        student.registration_number,
        student.name,
        student.session,
        student.phone,
        student.email,
        student.department,
      ].join(",")
    )
    .join("\n");

  const csv = headers + rows;

  return csv;
};

export const getAllGroupSummaries = async () => {
  const groups = await GroupModel.find().lean();

  return {
    totalGroups: groups.length,
    clocksUsed: groups.reduce((total, group) => {
      const clockDevices = group.devices.filter(
        (device) => device.deviceType === "clock"
      );
      return total + clockDevices.length;
    }, 0),
    attendancesUsed: groups.reduce((total, group) => {
      const attendanceDevices = group.devices.filter(
        (device) => device.deviceType === "attendance"
      );
      return total + attendanceDevices.length;
    }, 0),
    totalUsers: groups.reduce(
      (total, group) => total + group.members.length,
      0
    ),
  };
};

const summaryService = {
  dashboardPageSummary,
  downloadClockDevicesSummary,
  downloadAttendanceDevicesSummary,
  downloadStudentsSummary,
  getAllGroupSummaries,
};
export default summaryService;
