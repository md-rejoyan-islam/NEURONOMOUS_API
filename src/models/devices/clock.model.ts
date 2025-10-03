import mongoose, { Schema, Types } from "mongoose";
import { IClockDeviceSchema } from "../../app/types";

const ClockDeviceSchema: Schema<IClockDeviceSchema> =
  new mongoose.Schema<IClockDeviceSchema>(
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
      type: {
        type: String,
        enum: {
          values: ["single", "double"],
          message:
            "`{VALUE}` is not a valid type. Allowed values are: single, double.",
        },
      },
      mode: {
        type: String,
        enum: {
          values: ["clock", "notice", "stopwatch"],
          message:
            "`{VALUE}` is not a valid mode. Allowed values are: clock, notice, stopwatch.",
        },
        default: "clock",
      },
      firmware_version: {
        type: String,
        required: [true, "Firmware version is required"],
      },
      notice: {
        message: { type: String, default: null },
        is_pending: { type: Boolean, default: false },
      },
      name: {
        type: String,
        minlength: [2, "Device name must be at least 2 characters long"],
        maxlength: [100, "Device name must be at most 100 characters long"],
        default: null,
      },
      location: {
        type: String,
        maxlength: [200, "Location must be at most 200 characters long"],
        default: null,
      },
      scene: {
        type: String,
        enum: {
          values: ["scene1", "scene0", "scene2"], // HH:MM:SS or HH:MM-DD-MM
          message:
            "`{VALUE}` is not a valid scene. Allowed values are: scene1, scene2, scene0.",
        },
        default: "scene0",
      },
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
      free_heap: { type: Number, default: 0 },
      timestamp: { type: String, default: null },
      scheduled_notices: [
        {
          notice: { type: String, required: true },
          start_time: { type: Number, required: true }, // Unix timestamp in milliseconds
          end_time: { type: Number, required: true }, // duration in minutes
        },
      ],
      stopwatches: [
        {
          start_time: { type: Number, required: true }, // Unix timestamp in milliseconds
          end_time: { type: Number, required: true }, // Unix timestamp in milliseconds
          count_type: {
            type: String,
            required: [true, "Count type is required"],
            enum: {
              values: ["up", "down"], // up => 2, down => 1 , stop => 0
              message:
                "`{VALUE}` is not a valid mode. Allowed values are: up, down.",
            },
          },
          is_executed: { type: Boolean, default: false },
        },
      ],
    },
    {
      timestamps: true,
    }
  );

export const ClockDeviceModel = mongoose.model<IClockDeviceSchema>(
  "clock",
  ClockDeviceSchema
);
