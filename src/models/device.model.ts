import mongoose, { Schema, Types } from "mongoose";

export interface IDevice {
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
  pending_notice: boolean; // Indicates if there is a pending notice to be sent
  scheduled_notices: {
    id: string; // Unique ID for the scheduled notice
    notice: string;
    start_time: number; // Unix timestamp in milliseconds
    duration: number; // duration in minutes
  }[];
}

const DeviceSchema: Schema<IDevice> = new mongoose.Schema<IDevice>(
  {
    id: {
      type: String,
      required: [true, "Device ID is required"],
      unique: [true, "Device ID must be unique"],
    },
    name: {
      type: String,
      minlength: [2, "Device name must be at least 2 characters long"],
      maxlength: [100, "Device name must be at most 100 characters long"],
      default: null,
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
    location: {
      type: String,
      maxlength: [200, "Location must be at most 200 characters long"],
      default: null,
    },
    uptime: {
      type: Number,
      default: 0,
    },
    group: {
      type: Types.ObjectId,
      ref: "Group",
      default: null,
    }, // Reference to a Group model
    mode: {
      type: String,
      enum: {
        values: ["clock", "notice"],
        message:
          "`{VALUE}` is not a valid mode. Allowed values are: clock, notice.",
      },
      default: "clock",
    },
    last_seen: {
      type: Number, // Unix timestamp in milliseconds
      default: () => Date.now(),
      required: true,
    }, // last when the device was online
    notice: { type: String, default: null },
    duration: {
      type: Number,
      default: null,
      validate: {
        validator: function (val: number | null) {
          // Allow null, otherwise must be >= 0
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
          // Allow null, otherwise must be a greater than Date.now() and greater than start_time
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
    history: [
      {
        message: { type: String, required: true },
        timestamp: { type: Number, required: true }, // Unix timestamp in milliseconds
      },
    ],
    pending_notice: { type: Boolean, default: false },
    scheduled_notices: [
      {
        id: { type: String, required: true }, // Unique ID for the scheduled notice
        notice: { type: String, required: true },
        start_time: { type: Number, required: true }, // Unix timestamp in milliseconds
        duration: { type: Number, required: true }, // duration in minutes
      },
    ],
    // history: [
    //   {
    //     ntp_time: { type: String, required: true },
    //     rtc_before: { type: String, required: true },
    //     rtc_after: { type: String, required: true },
    //     time: { type: String, required: true }, // Store as string for consistency
    //   }]
  },
  {
    timestamps: true,
  }
);

export const DeviceModel = mongoose.model<IDevice>("Device", DeviceSchema);
