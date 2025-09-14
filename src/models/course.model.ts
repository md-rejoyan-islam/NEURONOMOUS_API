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
      ref: "Student",
      required: true,
    },
    presentBy: {
      type: String,
      default: "student",
    },
  },
  {
    timestamps: true,
  }
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
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentCourse",
      required: true,
    },
    session: {
      type: String,
      required: [true, "Session is required"],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Department is required"],
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
    enrolled_students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    records: [RecordSchema],
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CourseModel = mongoose.model<ICourseSchema>(
  "Course",
  CourseSchema
);
