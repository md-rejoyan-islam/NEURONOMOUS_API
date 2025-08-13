import mongoose, { Schema } from "mongoose";
import { IUserSchema } from "../app/types";
import { hashPassword } from "../utils/password";

const UserSchema: Schema<IUserSchema> = new mongoose.Schema<IUserSchema>(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name must be at most 50 characters long"],
    },
    last_name: {
      type: String,
      trim: true,
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
      maxlength: [50, "Password must be at most 50 characters long"],
      validate: {
        validator: function (val: string) {
          return /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(val);
        },
        message:
          "Password must contain at least one letter, one number, and be at least 6 characters long",
      },
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
    // allowed_devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
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

export const UserModel = mongoose.model<IUserSchema>("User", UserSchema);
