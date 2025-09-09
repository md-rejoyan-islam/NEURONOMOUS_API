import mongoose, { Schema } from "mongoose";
import { IFirmwareSchema } from "../app/types";

const FirmwareSchema: Schema<IFirmwareSchema> =
  new mongoose.Schema<IFirmwareSchema>(
    {
      version: {
        type: String,
        required: [true, "Firmware version is required"],
        unique: true,
        validate: {
          // format ( e.g., "1.0.0" or "2.1.3")
          validator: (v: string) => /^\d+\.\d+\.\d+$/.test(v),
          message: (props: { value: string }) =>
            `${props.value} is not a valid firmware version format. It should be in the format "x.y.z" where x, y, and z are integers.`,
        },
      },
      description: {
        type: String,
        required: [true, "Firmware description is required"],
        minlength: [
          10,
          "Firmware description must be at least 10 characters long",
        ],
      },
      file: {
        type: Buffer,
        required: [true, "Firmware file is required"],
        validate: {
          validator: function (v: Buffer) {
            console.log("Validating firmware file:", v);

            return v.length > 0;
          },
          message: "Firmware file cannot be empty",
        },
      },
      status: {
        type: String,
        enum: {
          values: ["active", "inactive"],
          message:
            "`{VALUE}` is not a valid status. Allowed values are: active, inactive.",
        },
        default: "inactive",
      },
      device_type: {
        type: String,
        required: [true, "Device type is required"],
        enum: {
          values: ["clock", "attendance"],
          message:
            "`{VALUE}` is not a valid device type. Allowed values are: clock, attendance.",
        },
      },
    },
    {
      timestamps: true,
    }
  );

export const FirmwareModel = mongoose.model<IFirmwareSchema>(
  "Firmware",
  FirmwareSchema
);
