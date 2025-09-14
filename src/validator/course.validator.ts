import { Types } from "mongoose";
import { z } from "zod";
const createCourseSchema = z.object({
  body: z
    .object({
      courseId: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Course ID is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Course ID must be a string.";
          }
          return "Invalid Course ID.";
        },
      }),
      session: z
        .string()
        .regex(/^\d{4}-\d{4}$/, "Session must follow the format YYYY-YYYY")
        .refine((val) => {
          const years = val.split("-").map(Number);
          return years[1] === years[0] + 1;
        }, "Session years must be consecutive"),
      instructor: z
        .string({
          error: "Instructor ID is required.",
        })
        .refine((id) => {
          return Types.ObjectId.isValid(id);
        }, "Invalid instructor ID."),
      department: z
        .string({
          error: "Department ID is required.",
        })
        .refine((id) => {
          return Types.ObjectId.isValid(id);
        }, "Invalid department ID."),
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
      department: z
        .string({
          error: "Department ID is required.",
        })
        .refine((id) => {
          return Types.ObjectId.isValid(id);
        }, "Invalid department ID."),
      eiin: z.string({
        error: "EIIN is required.",
      }),
    })
    .strict(),
});

const addAttendanceByDeviceSchema = z.object({
  body: z
    .object({
      deviceId: z.string({
        error: "Device ID is required.",
      }),
      date: z
        .string({
          error: "Date is required.",
        })
        .regex(/^\d{2}-\d{2}-\d{4}$/, {
          message: "Invalid format. Use DD-MM-YYYY (e.g. 21-07-2012).",
        }) // Ensure it's a real calendar date
        .refine(
          (str) => {
            const [dd, mm, yyyy] = str.split("-").map(Number);
            const d = new Date(yyyy, mm - 1, dd);
            return (
              d.getFullYear() === yyyy &&
              d.getMonth() === mm - 1 &&
              d.getDate() === dd
            );
          },
          {
            message: "Invalid calendar date (e.g. 31-04-2021 is not valid).",
          }
        ),
      records: z
        .array(
          z.object({
            studentId: z
              .string({ error: "Student ID is required." })
              .refine((id) => Types.ObjectId.isValid(id), {
                message: "Invalid student ID.",
              }),
            timestamp: z
              .string({
                error: "Timestamp is required.",
              })
              .refine((date) => !isNaN(Date.parse(date)), {
                message: "Invalid timestamp format. Use ISO format.",
              }),
          })
        )
        .min(1, "At least one attendance record is required."),
    })
    .strict(),
});

const addAttendanceByInstaructoreSchema = z.object({
  body: z
    .object({
      date: z
        .string({
          error: "Date is required.",
        })
        .regex(/^\d{2}-\d{2}-\d{4}$/, {
          message: "Invalid format. Use DD-MM-YYYY (e.g. 21-07-2012).",
        }) // Ensure it's a real calendar date
        .refine(
          (str) => {
            const [dd, mm, yyyy] = str.split("-").map(Number);
            const d = new Date(yyyy, mm - 1, dd);
            return (
              d.getFullYear() === yyyy &&
              d.getMonth() === mm - 1 &&
              d.getDate() === dd
            );
          },
          {
            message: "Invalid calendar date (e.g. 31-04-2021 is not valid).",
          }
        ),
    })
    .strict(),
});

const courseValidator = {
  createCourseSchema,
  createCourseForDepartmentSchema,
  addAttendanceByDeviceSchema,
  addAttendanceByInstaructoreSchema,
};

export default courseValidator;
