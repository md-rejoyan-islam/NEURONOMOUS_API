import mongoose, { Schema } from "mongoose";
import { IStudentSchema } from "../app/types";

const StudentSchema = new Schema<IStudentSchema>(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
    },
    email: {
      type: String,
      required: [true, "Student email is required"],
      unique: [true, "Student email must be unique"],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: `{VALUE} is not a valid email address!`,
      },
    },
    registration_number: {
      type: String,
      required: [true, "Registration number is required"],
      unique: [true, "Registration number must be unique"],
      trim: true,
    },
    session: {
      type: String,
      required: [true, "Session is required"],
    },
    rfid: {
      type: String,
      required: [true, "RFID is required"],
      unique: [true, "RFID must be unique"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const StudentModel = mongoose.model<IStudentSchema>("Student", StudentSchema);
export default StudentModel;
