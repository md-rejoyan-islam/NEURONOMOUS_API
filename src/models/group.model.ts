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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const GroupModel = mongoose.model<IGroupSchema>("Group", GroupSchema);
