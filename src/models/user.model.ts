import mongoose, { Schema } from "mongoose";
import { hashPassword } from "../utils/password";

export interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "superadmin";
  status: "active" | "inactive";
  phone: string | null;
  address: string | null;
  notes: string | null;
  last_login: number; // Unix timestamp in milliseconds
  reset_code: string | null; // Reset code for password reset
  reset_code_expires: number | null; // Unix timestamp in milliseconds for when the reset code expires
  group: mongoose.Schema.Types.ObjectId | null; // Reference to a Group model
  allowed_devices: mongoose.Schema.Types.ObjectId[]; // Array of device IDs that the user
  refresh_token: string | null; // Optional refresh token for the user
}

const UserSchema: Schema<IUser> = new mongoose.Schema<IUser>(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name must be at most 50 characters long"],
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name must be at most 50 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["user", "admin", "superadmin"],
        message:
          "`{VALUE}` is not a valid role. Allowed values are: user, admin, superadmin.",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message:
          "`{VALUE}` is not a valid status. Allowed values are: active, inactive.",
      },
      default: "active",
    },
    phone: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    last_login: {
      type: Number, // Unix timestamp in milliseconds
      default: () => Date.now(),
    },
    refresh_token: {
      type: String,
      default: null,
    },
    reset_code: {
      type: String,
      default: null,
    },
    reset_code_expires: {
      type: Number, // Unix timestamp in milliseconds
      default: null,
      validate: {
        validator: function (val: number | null) {
          // Allow null, otherwise must be a future timestamp
          return val === null || val > Date.now();
        },
        message: "Reset code expiration must be a future timestamp",
      },
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    allowed_devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
  },
  {
    timestamps: true,
  }
);

// UserSchema.index({ email: 1 }, { unique: true });

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hashPassword(this.password);
    next();
  } else {
    next();
  }
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
