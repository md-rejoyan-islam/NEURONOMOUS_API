import mongoose, { Schema, Types } from "mongoose";
import { IAttendanceDeviceSchema } from "../app/types";

const AttendanceDeviceSchema: Schema<IAttendanceDeviceSchema> =
  new mongoose.Schema<IAttendanceDeviceSchema>(
    {
      id: {
        type: String,
        required: [true, "Device ID is required"],
        unique: [true, "Device ID must be unique"],
      },
      mac_id: {
        type: String,
        unique: [true, "MAC ID must be unique"],
        required: [true, "MAC ID is required"],
      },
      status: {
        type: String,
        required: [true, "Device status is required"],
        enum: {
          values: ["online", "offline"],
          message:
            "`{VALUE}` is not a valid status. Allowed values are: online, offline.",
        },
        default: "offline",
      },
      firmware_version: {
        type: String,
        required: [true, "Firmware version is required"],
      },
      // name: {
      //   type: String,
      //   minlength: [2, "Device name must be at least 2 characters long"],
      //   maxlength: [100, "Device name must be at most 100 characters long"],
      //   default: null,
      // },
      // location: {
      //   type: String,
      //   maxlength: [200, "Location must be at most 200 characters long"],
      //   default: null,
      // },
      group: {
        type: Types.ObjectId,
        ref: "Group",
        default: null,
      },
      allowed_users: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
      last_seen: {
        type: Number, // Unix timestamp in milliseconds
        default: () => Date.now(),
        required: true,
      }, // last when the device was online
      free_heap: { type: Number, default: 0 },
    },
    {
      timestamps: true,
    }
  );

export const AttendanceDeviceModel = mongoose.model<IAttendanceDeviceSchema>(
  "AttendanceDevice",
  AttendanceDeviceSchema
);
