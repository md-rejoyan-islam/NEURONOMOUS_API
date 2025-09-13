import { Types } from "mongoose";
import z, { string } from "zod";

// add user to group with devices permission validation schema
export const addUserToGroupWithDevicesPermissionSchema = z.object({
  body: z
    .object({
      email: z.email({
        error: (iss) => {
          if (!iss.input) {
            return "Email is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Email must be a string.";
          }
          return "Invalid email format.";
        },
      }),
      password: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Password is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Password must be a string.";
            }
            return "Invalid password.";
          },
        })
        .min(6, "Password must be at least 6 characters long")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one digit.",
        }),
      first_name: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "First name is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "First name must be a string.";
          }
          return "Invalid first name.";
        },
      }),
      last_name: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Last name is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Last name must be a string.";
          }
          return "Invalid last name.";
        },
      }),
      deviceType: z.enum(["clock", "attendance"], {
        error: (iss) => {
          if (!iss.input) {
            return "Device type is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Device type must be a string.";
          }
          return "Invalid device type.";
        },
      }),
      deviceIds: z
        .array(string(), {
          error: (iss) => {
            if (!iss.input) {
              return "Device IDs are required.";
            } else if (!Array.isArray(iss.input)) {
              return "Device IDs must be an array.";
            }
            return "Invalid device IDs.";
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
            message: "Each device ID must be a valid ObjectId string.",
          }
        ),
      phone: z.string().optional(),
      notes: z.string().optional(),
    })
    .strict(),
});

// add device to group validation schema
export const addDeviceToGroupSchema = z.object({
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
// add attendace device to group validation schema
export const addAttendanceDeviceToGroupSchema = z.object({
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

export const updateGroupSchema = z.object({
  body: z
    .object({
      name: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Group name is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Group name must be a string.";
          }
          return "Invalid group name.";
        },
      }),
      eiin: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Group EIIN is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Group EIIN must be a string.";
          }
          return "Invalid group EIIN.";
        },
      }),
      description: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Group description is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Group description must be a string.";
            }
            return "Invalid group description.";
          },
        })
        .optional(),
    })
    .strict(),
});

const createCourseForDepartmentSchema = z.object({
  body: z
    .object({
      code: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Course code is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Course code must be a string.";
          }
          return "Invalid course code.";
        },
      }),
      name: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Course name is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Course name must be a string.";
          }
          return "Invalid course name.";
        },
      }),
    })
    .strict(),
});

const groupValidator = {
  createCourseForDepartmentSchema,
};

export default groupValidator;
