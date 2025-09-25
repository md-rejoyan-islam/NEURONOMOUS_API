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
      notice: { type: String, default: null },
      uptime: {
        type: Number,
        default: 0,
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
      duration: {
        type: Number,
        default: null,
        validate: {
          validator: function (val: number | null) {
            return val === null || val >= 0;
          },
          message: "Duration must be greater than or equal to 0",
        },
      },
      start_time: {
        type: Number, // Unix timestamp in milliseconds
        default: null,
        validate: {
          validator: function (val: number | null) {
            // Allow null, otherwise must be a greater than Date.now()
            return val === null || val > Date.now();
          },
          message: "Start time must be greater than the current time",
        },
      },
      end_time: {
        type: Number, // Unix timestamp in milliseconds
        default: null,
        validate: {
          validator: function (val: number | null): boolean {
            return (
              val === null ||
              (val > Date.now() &&
                (this.start_time === null || val > this.start_time))
            );
          },
          message:
            "End time must be greater than the current time and start time",
        },
      },
      free_heap: { type: Number, default: 0 },
      timestamp: { type: String, default: null },
      // history: [
      //   {
      //     message: { type: String, required: true },
      //     timestamp: { type: Number, required: true }, // Unix timestamp in milliseconds
      //   },
      // ],
      pending_notice: { type: Boolean, default: false },
      scheduled_notices: [
        {
          id: { type: String, required: true }, // Unique ID for the scheduled notice
          notice: { type: String, required: true },
          start_time: { type: Number, required: true }, // Unix timestamp in milliseconds
          duration: { type: Number, required: true }, // duration in minutes
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
