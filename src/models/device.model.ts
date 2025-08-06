import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Device ID is required"],
      unique: [true, "Device ID must be unique"],
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
    last_seen: { type: String, required: true },
    mode: {
      type: String,
      enum: {
        values: ["clock", "notice"],
        message:
          "`{VALUE}` is not a valid mode. Allowed values are: clock, notice.",
      },
      default: "clock",
    },
    current_notice: { type: String, default: null },
    pending_notice: { type: Boolean, default: false },
    uptime: {
      type: Number,
      default: 0,
    },
    free_heap: { type: Number, default: 0 },
    duration: {
      type: Number, // duration in seconds
      nullable: true,
      validate: {
        validator: (val: number) => val >= 0,
        message: "Duration must be greater than or equal 0",
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const DeviceModel = mongoose.model("Device", DeviceSchema);
