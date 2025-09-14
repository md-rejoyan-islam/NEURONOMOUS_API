import mongoose, { Schema } from "mongoose";
import { IDepartmentCourseSchema } from "../app/types";

const DepartmentCourseSchema: Schema<IDepartmentCourseSchema> =
  new mongoose.Schema<IDepartmentCourseSchema>(
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
      department: {
        type: Schema.Types.ObjectId,
        ref: "Group",
        required: [true, "Department is required"],
      },
    },
    {
      timestamps: true,
    }
  );

export const DepartmentCourseModel = mongoose.model<IDepartmentCourseSchema>(
  "DepartmentCourse",
  DepartmentCourseSchema
);
