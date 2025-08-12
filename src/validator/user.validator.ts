import z from "zod";

// create admin user with group validation schema
export const createAdminUserWithGroupSchema = z.object({
  body: z
    .object({
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
      group_name: z.string({
        error: (iss) => {
          if (!iss.input) {
            return "Group name is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Group name must be a string.";
          }
          return "Invalid group name.";
        },
      }),
      group_description: z
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
        .min(10, "Group description must be at least 10 characters long")
        .optional(),
      role: z
        .enum(["admin", "user"], {
          error: (iss) => {
            if (!iss.input) {
              return "Role is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Role must be a string.";
            }
            return "Invalid role. Must be 'admin' or 'user'.";
          },
        })
        .optional(),
    })
    .strict(),
});
export const changeUserPasswordSchema = z.object({
  body: z
    .object({
      newPassword: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "New password is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "New password must be a string.";
            }
            return "Invalid new password.";
          },
        })
        .min(6, "New password must be at least 6 characters long")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
          message:
            "New password must contain at least one uppercase letter, one lowercase letter, and one digit.",
        }),
    })
    .strict(),
});
