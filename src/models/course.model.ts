import mongoose, { Schema } from "mongoose";
import { ICourseSchema } from "../app/types";

const PresentStudentSchema = new Schema(
  {
    presentId: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const RecordSchema = new Schema(
  {
    recordId: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    date: { type: String, required: true },
    present_students: [PresentStudentSchema],
  },
  { timestamps: true }
);

const CourseSchema: Schema<ICourseSchema> = new mongoose.Schema<ICourseSchema>(
  {
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: [true, "Course code must be unique"],
    },
    name: {
      type: String,
      required: [true, "Course name is required"],
    },
    session: {
      type: String,
      required: [true, "Session is required"],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
    },
    enroll_link: {
      type: String,
      required: [true, "Enroll link is required"],
    },
    enrolled_students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    records: [RecordSchema],
  },
  {
    timestamps: true,
  }
);

export const CourseModel = mongoose.model<ICourseSchema>(
  "Course",
  CourseSchema
);
