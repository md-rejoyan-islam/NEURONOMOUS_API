import { AttendanceDeviceModel } from "../models/attendance-device.model";

export const getAllAttendanceDevicesService = async () => {
  const devices = await AttendanceDeviceModel.find()
    .select("-__v -createdAt -updatedAt")
    .populate({
      path: "group",
      select: "name location",
      populate: {
        path: "members.id",
        select: "email role",
      },
    })
    .lean();
  return devices;
};
