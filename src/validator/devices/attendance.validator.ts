import z from "zod";

export const addAttendanceToGroupSchema = z.object({
  body: z
    .object({
      deviceId: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Device ID is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Device ID must be a string.";
          }
          return "Invalid device ID.";
        },
      }),
    })
    .strict(),
});
