import mongoose from "mongoose";

// device_id, runAt,

const ScheduleSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
    },
    runAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ScheduleModel = mongoose.model("Schedule", ScheduleSchema);
