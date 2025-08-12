import z from "zod";

export const changeDeviceModeSchema = z.object({
  body: z
    .object({
      mode: z.enum(["clock", "notice"], {
        error: (iss) => {
          if (!iss.input) {
            return "Mode is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Mode must be a string.";
          }
          return `Invalid mode. Allowed values are: clock, notice.`;
        },
      }),
    })
    .strict(),
});

export const sendNoticeToDeviceSchema = z.object({
  body: z
    .object({
      notice: z.string().min(1, "Notice must be a non-empty string."),
      duration: z
        .number()
        .int("Duration must be an integer.")
        .min(1, "Duration must be at least 1 minute.")
        .optional(),
    })
    .strict(),
});

export const scheduleNoticeForDeviceSchema = z.object({
  body: z
    .object({
      notice: z.string().min(1, "Notice must be a non-empty string."),
      startTime: z
        .number()
        .int("Start time must be a valid timestamp.")
        .refine((val) => val > Date.now(), {
          message: "Start time must be in the future.",
        }),
      endTime: z
        .number()
        .int("End time must be a valid timestamp.")
        .refine((val) => val > Date.now(), {
          message: "Start time must be in the future.",
        }),
    })
    .refine(
      (data: { notice: string; startTime: number; endTime: number }) => {
        return data.startTime < data.endTime;
      },
      {
        message: "Start time must be before end time.",
      }
    )
    .strict(),
});
