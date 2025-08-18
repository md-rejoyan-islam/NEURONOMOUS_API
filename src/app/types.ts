import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

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

export interface IDeviceSchema {
  id: string;
  name: string | null;
  status: "online" | "offline";
  location: string | null;
  uptime: number;
  mode: "clock" | "notice";
  last_seen: number; // Unix timestamp in milliseconds
  notice: string | null;
  duration: number | null; // duration in minutes, can be null
  start_time: number | null; // Unix timestamp in milliseconds, can be null
  end_time: number | null; // Unix timestamp in milliseconds, can be null
  free_heap: number;
  group: Types.ObjectId | null; // Reference to a Group model
  history: {
    message: string;
    timestamp: number;
  }[];
  allowed_users?: Types.ObjectId[]; // Array of user IDs allowed to access the device
  pending_notice: boolean; // Indicates if there is a pending notice to be sent
  scheduled_notices: {
    id: string; // Unique ID for the scheduled notice
    notice: string;
    start_time: number; // Unix timestamp in milliseconds
    duration: number; // duration in minutes
  }[];
  type: "single" | "double"; // Type of the device, e.g., single or double display
  firmware_version: string | null; // Firmware version of the device
  last_firmware_update: number | null; // Unix timestamp in milliseconds, can be null
  font: string | null; // Font used by the device, can be null
  time_format: "12h" | "24h"; // Time format used by the device
}
export interface IDevice extends IDeviceSchema {
  _id: Types.ObjectId; // Mongoose ObjectId or string
}
export interface IGroupSchema {
  name: string;
  description: string;
  devices: Types.ObjectId[];
  members: Types.ObjectId[];
}

export interface IGroup extends Pick<IGroupSchema, "name" | "description"> {
  _id: Types.ObjectId;
  devices: Types.ObjectId[] | IDevice[];
  members: Types.ObjectId[] | IUser[];
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
