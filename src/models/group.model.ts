import mongoose, { Schema } from "mongoose";

export interface IGroup {
  name: string;
  description: string;
  devices: mongoose.Types.ObjectId[]; // Array of device IDs
  members: mongoose.Types.ObjectId[]; // Array of user IDs
}

const GroupSchema: Schema<IGroup> = new mongoose.Schema<IGroup>(
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

export const GroupModel = mongoose.model<IGroup>("Group", GroupSchema);
