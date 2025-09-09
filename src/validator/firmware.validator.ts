import z from "zod";

export const createFirmwareSchema = z.object({
  body: z
    .object({
      version: z.string("Firmware version must be a positive number."),
      description: z.string().min(10, {
        message: "Firmware description must be at least 10 characters long.",
      }),
      device_type: z.enum(["clock", "attendance"], {
        message: 'Device type must be either "clock" or "attendance".',
      }),
    })
    .strict(),
});

export const updateDeviceFirmwareSchema = z.object({
  body: z
    .object({
      version: z.string("Firmware version must be a positive number."),
    })
    .strict(),
});

export const updateFirmwareStatusSchema = z.object({
  body: z
    .object({
      status: z.enum(["active", "inactive"], {
        message: 'Status must be either "active" or "inactive".',
      }),
    })
    .strict(),
});
