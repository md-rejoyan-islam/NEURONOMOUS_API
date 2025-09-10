import { Types } from "mongoose";
import { IGroup } from "../app/types";
import { AttendanceDeviceModel } from "../models/attendance-device.model";
import { CourseModel } from "../models/course.model";

export const getAllAttendanceDevicesService = async () => {
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

export const getAttendanceDeviceByIdService = async (deviceId: string) => {
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
  }).lean();

  return {
    ...device,
    courses: courses.map((course) => ({
      _id: course._id,
      code: course.code,
      name: course.name,
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
