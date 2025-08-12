import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IDevice {
  _id: Types.ObjectId;
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
  history: {
    message: string;
    timestamp: number;
  }[];
  pending_notice: boolean; // Indicates if there is a pending notice to be sent
  scheduled_notices: {
    id: string; // Unique ID for the scheduled notice
    notice: string;
    start_time: number; // Unix timestamp in milliseconds
    duration: number; // duration in minutes
  }[];
}

export interface IDeviceData {
  ntp_time: string;
  rtc_before: string;
  rtc_after: string;
  time: string;
}

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

export interface IGroup {
  _id: Types.ObjectId;
  name: string;
  description: string;
  devices: IDevice[]; // Array of device IDs
  members: IUser[]; // Array of user IDs
}

export interface IGroupWithPopulateDevices extends IGroup {
  devices: IDevice[]; // Array of device objects
}

export interface IUser extends Document {
  _id: Types.ObjectId;
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
  reset_code: string | null; // Reset code for password reset
  reset_code_expires: number | null; // Unix timestamp in milliseconds for when the reset code expires
  group: Types.ObjectId | null; // Reference to a Group model
  allowed_devices: Types.ObjectId[]; // Array of device IDs that the user
  refresh_token: string | null;
}

export interface IUserWithPopulateGroup
  extends Omit<IUser, "group" | "allowed_devices"> {
  _id: Types.ObjectId;
  group: IGroup | null; // Reference to a Group model
}
export interface IUserWithPopulateDevices
  extends Omit<IUser, "group" | "allowed_devices"> {
  _id: Types.ObjectId;
  group: IGroup | null; // Reference to a Group model
  allowed_devices: IDevice[]; // Array of device objects
}

export interface IRequestWithUser extends Request {
  user?: IUser;
}

export type ROLE = "user" | "admin" | "superadmin";
