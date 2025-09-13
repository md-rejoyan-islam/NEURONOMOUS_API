import { Types } from "mongoose";
import { z } from "zod";
const createCourseSchema = z.object({
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

const courseValidator = {
  createCourseSchema,
  createCourseForDepartmentSchema,
};

export default courseValidator;
