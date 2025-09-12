import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Document, Types } from "mongoose";

export interface ISuccessResponse {
  statusCode?: number;
  message?: string;
  payload?: object;
}

export interface IErrorResponse {
  success: boolean;
  message: string;
  errors: { path: string | number; message: string }[];
  stack?: string;
}

export type IFirmwareSchema = Document & {
  version: string;
  description: string;
  file: Buffer;
  status: "active" | "inactive";
  device_type: "clock" | "attendance";
  createdAt: Date;
  updatedAt: Date;
};

export interface IFirmware extends IFirmwareSchema {
  _id: Types.ObjectId; // Mongoose ObjectId or string
}

export interface IUserSchema {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "superadmin";
  status: "active" | "inactive";
  phone: string | null;
  address: string | null;
  notes: string | null;
  last_login: number; // Unix timestamp in milliseconds
  reset_code: string | null;
  reset_code_expires: number | null; // Unix timestamp in milliseconds
  group: Types.ObjectId | null; // Reference to a Group model
  refresh_token: string | null;
  // allowed_devices: mongoose.Schema.Types.ObjectId[]; // Array of device IDs that the user
}

export interface IUser extends IUserSchema {
  _id: Types.ObjectId; // Mongoose ObjectId or string
}

export interface ICourseSchema {
  code: string;
  name: string;
  session: string;
  department: Types.ObjectId;
  instructor: Types.ObjectId;
  enroll_link: string;
  enrolled_students: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  is_active: boolean;
  records: {
    recordId: Types.ObjectId;
    date: string;
    present_students: {
      presentId: Types.ObjectId;
      student: Types.ObjectId;
      createdAt: Date;
      updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface IStudentSchema {
  name: string;
  email: string;
  session: string;
  registration_number: string;
  rfid: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClockDeviceSchema {
  id: string;
  mac_id: string;
  status: "online" | "offline";
  mode: "clock" | "notice";
  notice: string | null;
  name: string | null;
  uptime: number;
  end_time: number | null; // Unix timestamp in milliseconds, can be null
  firmware_version: string | null;
  type: "single" | "double";
  free_heap: number;
  location: string | null;
  last_seen: number; // Unix timestamp in milliseconds
  duration: number | null; // duration in minutes, can be null
  start_time: number | null; // Unix timestamp in milliseconds, can be null
  last_firmware_update: number | null; // Unix timestamp in milliseconds, can be null
  group: Types.ObjectId | null; // Reference to a Group model
  allowed_users?: Types.ObjectId[]; // Array of user IDs allowed to access the device
  pending_notice: boolean; // Indicates if there is a pending notice to be sent
  scheduled_notices: {
    id: string; // Unique ID for the scheduled notice
    notice: string;
    start_time: number; // Unix timestamp in milliseconds
    duration: number; // duration in minutes
  }[];
  font: string | null;
  time_format: "12h" | "24h";
  timestamp: string;
}
export interface IDevice extends IClockDeviceSchema {
  _id: Types.ObjectId; // Mongoose ObjectId or string
}

export interface IAttendanceDeviceSchema {
  id: string;
  mac_id: string;
  status: "online" | "offline";
  firmware_version: string;
  group: Types.ObjectId | null; // Reference to a Group model
  allowed_users?: Types.ObjectId[]; // Array of user IDs allowed to access the device
  last_seen: number; // Unix timestamp in milliseconds
  free_heap: number;
}
export interface IAttendanceDevice extends IAttendanceDeviceSchema {
  _id: Types.ObjectId; // Mongoose ObjectId or string
}

export interface IGroupSchema {
  name: string;
  description: string;
  eiin: string;
  devices: {
    deviceType: "attendance" | "clock";
    deviceId: Types.ObjectId;
  }[];
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Pick<IGroupSchema, "name" | "description"> {
  _id: Types.ObjectId;
  // devices: Types.ObjectId[] | IDevice[];
  members: (Types.ObjectId | IUser)[];
  devices: (
    | {
        deviceType: "attendance" | "clock";
        deviceId: Types.ObjectId;
      }
    | {
        deviceType: "attendance";
        deviceId: IAttendanceDevice;
      }
    | {
        deviceType: "clock";
        deviceId: IDevice;
      }
  )[];
}

export interface IRequestWithUser extends Request {
  user?: Pick<IUser, "_id" | "email" | "role">;
}

export interface IJwtPayload extends JwtPayload {
  _id: string;
  role: "superadmin" | "admin" | "user";
  loginCode: number;
}

export type ROLE = "user" | "admin" | "superadmin";
