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
    // courses: [
    //   {
    //     name: {
    //       type: String,
    //       required: [true, "Course name is required"],
    //       unique: [true, "Course name must be unique"],
    //     },
    //     code: {
    //       type: String,
    //       required: [true, "Course code is required"],
    //       unique: [true, "Course code must be unique"],
    //     },
    //   },
    // ],
    // students: [
    //   {
    //     name: {
    //       type: String,
    //       required: [true, "Student name is required"],
    //       minlength: [2, "Student name must be at least 2 characters long"],
    //       maxlength: [100, "Student name must be at most 100 characters long"],
    //     },
    //     email: {
    //       type: String,
    //       required: [true, "Student email is required"],
    //       unique: [true, "Student email must be unique"],
    //     },
    //     session: {
    //       type: String,
    //       required: [true, "Session is required"],
    //     },
    //     registration_number: {
    //       type: String,
    //       required: [true, "Registration number is required"],
    //       unique: [true, "Registration number must be unique"],
    //     },
    //     rfid: {
    //       type: String,
    //       required: [true, "RFID is required"],
    //       unique: [true, "RFID must be unique"],
    //     },
    //   },
    // ],
    // courses_with_instructor: [
    //   {
    //     course: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Course",
    //       required: true,
    //     },
    //     session: {
    //       type: String,
    //       required: [true, "Session is required"],
    //     },
    //     instactor: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "User",
    //       required: true,
    //     },
    //     share_groups: [
    //       {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Group",
    //       },
    //     ],
    //     is_active: {
    //       type: Boolean,
    //       default: true,
    //     },
    //     enroll_link: {
    //       type: String,
    //       required: [true, "Enroll link is required"],
    //     },
    //     enrolled_students: [
    //       {
    //         student: {
    //           type: mongoose.Schema.Types.ObjectId,
    //           ref: "Student",
    //         },
    //         timestamp: {
    //           type: Date,
    //           default: Date.now,
    //         },
    //       },
    //     ],
    //     records: [RecordSchema],
    //     createdAt: {
    //       type: Date,
    //       default: Date.now,
    //     },
    //   },
    // ],
    // shared_courses: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Course",
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);

export const GroupModel = mongoose.model<IGroupSchema>("Group", GroupSchema);
