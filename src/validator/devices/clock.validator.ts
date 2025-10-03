import { Types } from "mongoose";
import { z } from "zod";

// add device to group validation schema
const addClockToGroup = z.object({
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
      name: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Device name is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Device name must be a string.";
          }
          return "Invalid device name.";
        },
      }),
      location: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Device location is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Device location must be a string.";
          }
          return "Invalid device location.";
        },
      }),
    })
    .strict(),
});

export const changeDeviceMode = z.object({
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

export const sendNoticeToDevice = z.object({
  body: z
    .object({
      notice: z.string().min(1, "Notice must be a non-empty string."),
      start_time: z.number().int("Start time must be a valid timestamp."),
      end_time: z
        .number()
        .int("End time must be a valid timestamp.")
        .refine(
          (val) => {
            if (val === 0) return true;
            return val > Date.now();
          },
          {
            message: "Start time must be in the future.",
          }
        ),
      is_scheduled: z.boolean({
        error: (iss) => {
          if (typeof iss.input !== iss.expected) {
            return "is_scheduled must be a boolean.";
          }
          return "Invalid is_scheduled value.";
        },
      }),
    })
    .strict(),
});

export const sendNoticeToSelectedDevice = sendNoticeToDevice.extend({
  body: z.object({
    deviceIds: z
      .array(z.string(), {
        error: (iss) => {
          if (!iss.input) {
            return "Device IDs are required.";
          } else if (!Array.isArray(iss.input)) {
            return "Device IDs must be an array.";
          }
          return "Invalid Device IDs.";
        },
      })
      .refine(
        (ids) => {
          if (ids.length === 0) {
            return false;
          }
          return ids.every((id) => Types.ObjectId.isValid(id));
        },
        {
          message: "Each Device ID must be a valid ObjectId string.",
        }
      ),
  }),
});

export const scheduleNoticeForDevice = z.object({
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

export const giveDeviceAccessToUsers = z.object({
  body: z
    .object({
      userIds: z
        .array(z.string(), {
          error: (iss) => {
            if (!iss.input) {
              return "User IDs are required.";
            } else if (!Array.isArray(iss.input)) {
              return "User IDs must be an array.";
            }
            return "Invalid User IDs.";
          },
        })
        .refine(
          (ids) => {
            if (ids.length === 0) {
              return false;
            }
            return ids.every((id) => Types.ObjectId.isValid(id));
          },
          {
            message: "Each User ID must be a valid ObjectId string.",
          }
        ),
    })
    .strict(),
});

export const changeSelectedDeviceMode = z.object({
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
      deviceIds: z
        .array(z.string(), {
          error: (iss) => {
            if (!iss.input) {
              return "Device IDs are required.";
            } else if (!Array.isArray(iss.input)) {
              return "Device IDs must be an array.";
            }
            return "Invalid Device IDs.";
          },
        })
        .refine(
          (ids) => {
            if (ids.length === 0) {
              return false;
            }
            return ids.every((id) => Types.ObjectId.isValid(id));
          },
          {
            message: "Each Device ID must be a valid ObjectId string.",
          }
        ),
    })
    .strict(),
});

export const getAllDevices = z.object({
  query: z
    .object({
      mode: z
        .enum(["clock", "notice"], {
          error: (iss) => {
            if (typeof iss.input !== iss.expected) {
              return "Mode must be a string.";
            }
            return `Invalid mode. Allowed values are: clock, notice.`;
          },
        })
        .optional(),
      type: z
        .enum(["single", "double"], {
          error: (iss) => {
            if (typeof iss.input !== iss.expected) {
              return "Type must be a string.";
            }
            return `Invalid type. Allowed values are: single, double.`;
          },
        })
        .optional(),

      status: z
        .enum(["online", "offline"], {
          error: (iss) => {
            if (typeof iss.input !== iss.expected) {
              return "Status must be a string.";
            }
            return `Invalid status. Allowed values are: online, offline.`;
          },
        })
        .optional(),
      search: z.string().optional(),
    })
    .strict(),
});

export const sendScheduleNoticeToSelectedDevice =
  scheduleNoticeForDevice.extend({
    body: z.object({
      deviceIds: z
        .array(z.string(), {
          error: (iss) => {
            if (!iss.input) {
              return "Device IDs are required.";
            } else if (!Array.isArray(iss.input)) {
              return "Device IDs must be an array.";
            }
            return "Invalid Device IDs.";
          },
        })
        .refine(
          (ids) => {
            if (ids.length === 0) {
              return false;
            }
            return ids.every((id) => Types.ObjectId.isValid(id));
          },
          {
            message: "Each Device ID must be a valid ObjectId string.",
          }
        ),
    }),
  });

const clockValidator = {
  addClockToGroup,
  changeDeviceMode,
  sendNoticeToDevice,
  sendNoticeToSelectedDevice,
  scheduleNoticeForDevice,
  giveDeviceAccessToUsers,
  changeSelectedDeviceMode,
  getAllDevices,
  sendScheduleNoticeToSelectedDevice,
};

export default clockValidator;
