import mongoose, { Schema } from "mongoose";
import { IGroupSchema } from "../app/types";

const GroupSchema: Schema<IGroupSchema> = new mongoose.Schema<IGroupSchema>(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      minlength: [2, "Group name must be at least 2 characters long"],
      maxlength: [50, "Group name must be at most 50 characters long"],
    },
    description: {
      type: String,
      required: [true, "Group description is required"],
      minlength: [10, "Group description must be at least 10 characters long"],
    },
    devices: [
      {
        deviceType: {
          type: String,
          required: true,
          enum: ["attendance", "clock"],
        },
        deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "devices.deviceType",
        },
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    eiin: {
      type: String,
      required: [true, "EIIN is required"],
    },
    courses: [
      {
        name: {
          type: String,
          required: [true, "Course name is required"],
          unique: [true, "Course name must be unique"],
        },
        code: {
          type: String,
          required: [true, "Course code is required"],
          unique: [true, "Course code must be unique"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const GroupModel = mongoose.model<IGroupSchema>("Group", GroupSchema);
