import z from "zod";

export const createFirmwareSchema = z.object({
  body: z
    .object({
      version: z.string("Firmware version must be a positive number."),
      description: z.string().min(10, {
        message: "Firmware description must be at least 10 characters long.",
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
