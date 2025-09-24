import { Document, Schema, model } from "mongoose";

export interface ISchedule extends Document {
  start_time: number; // unix timestamp in milliseconds
  end_time: number; // unix timestamp in milliseconds
  is_executed: boolean;
  category: {
    device_id: string;
    schedule_id: string;
    for: "timer" | "notice"; // "notice" or "timer"
    message: string | null;
    count_type: "up" | "down" | null; // "up" / "down" / "null"
  };
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    start_time: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => !isNaN(v) && v > Date.now(),
        message: "start_time must be a valid future Unix timestamp",
      },
    },
    end_time: {
      type: Number,
      required: true,
      validate: {
        validator: function (v: number) {
          return !isNaN(v) && v > this.start_time;
        },
        message: "end_time must be after start_time",
      },
    },
    is_executed: { type: Boolean, default: false },
    category: {
      device_id: {
        type: String,
        required: [true, "Device ID is required"],
      },
      schedule_id: {
        type: String,
        required: [true, "Schedule ID is required"],
      },
      for: {
        type: String,
        enum: {
          values: ["timer", "notice"],
          message:
            "`{VALUE}` is not a valid category. Allowed values are: timer, notice.",
        },
        required: [true, "Category 'for' field is required"],
      },
      message: { type: String, default: null },
      count_type: {
        type: String,
        enum: {
          values: ["up", "down", null],
          message:
            "`{VALUE}` is not a valid count type. Allowed values are: up, down, null.",
        },
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Schedule = model<ISchedule>("Schedule", ScheduleSchema);
