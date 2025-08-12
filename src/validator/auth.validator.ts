import { z } from "zod";

export const loginSchema = z.object({
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
        .min(6, {
          message: "Password must be at least 6 characters long.",
        }),
    })
    .strict(),
});

export const forgotPasswordSchema = z.object({
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
    })
    .strict(),
});

export const resetPasswordSchema = z.object({
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
      resetCode: z
        .number({
          error: (iss) => {
            if (!iss.input) {
              return "Reset code is required.";
            }
            if (typeof iss.input !== iss.expected) {
              return "Reset code must be a number.";
            }
            return "Invalid reset code.";
          },
        })
        .int({
          message: "Reset code must be an integer.",
        }),

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
        .min(6, {
          message: "New password must be at least 6 characters long.",
        })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
          message:
            "New password must contain at least one uppercase letter, one lowercase letter, and one number.",
        }),
    })
    .strict(),
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.jwt({
        error: (iss) => {
          if (!iss.input) {
            return "Refresh token is required.";
          } else if (typeof iss.input !== "string") {
            return "Refresh token must be a string.";
          }
          return "Invalid refresh token format.";
        },
      }),
    })
    .strict(),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Current password is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Current password must be a string.";
            }
            return "Invalid current password.";
          },
        })
        .min(6, {
          message: "Current password must be at least 6 characters long.",
        }),
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
        .min(6, {
          message: "New password must be at least 6 characters long.",
        })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
          message:
            "New password must contain at least one uppercase letter, one lowercase letter, and one number.",
        }),
    })
    .strict(),
});

export const updateAuthProfileSchema = z.object({
  body: z
    .object({
      first_name: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "First name is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "First name must be a string.";
            }
            return "Invalid first name.";
          },
        })
        .optional(),
      last_name: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Last name is required.";
            }
            if (typeof iss.input !== iss.expected) {
              return "Last name must be a string.";
            }
            return "Invalid last name.";
          },
        })
        .optional(),
      phone: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Phone number is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Phone number must be a string.";
            }
            return "Invalid phone number.";
          },
        })
        .optional(),
      address: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Address is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Address must be a string.";
            }
            return "Invalid address.";
          },
        })
        .optional(),
      notes: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Notes are required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Notes must be a string.";
            }
            return "Invalid notes.";
          },
        })
        .optional(),
    })
    .strict(),
});

export const createUserSchema = z.object({
  body: z
    .object({
      first_name: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "First name is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "First name must be a string.";
            }
            return "Invalid first name.";
          },
        })
        .min(2, {
          message: "First name must be at least 2 characters long.",
        }),
      last_name: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Last name is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Last name must be a string.";
            }
            return "Invalid last name.";
          },
        })
        .min(2, {
          message: "Last name must be at least 2 characters long.",
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
        .min(6, {
          message: "Password must be at least 6 characters long.",
        }),
      role: z.enum(["admin", "user", "superadmin"], {
        error: (iss) => {
          if (!iss.input) {
            return "Role is required.";
          } else if (typeof iss.input !== iss.expected) {
            return "Role must be a string.";
          }
          return "Invalid role.";
        },
      }),
      phone: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Phone number is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Phone number must be a string.";
            }
            return "Invalid phone number.";
          },
        })
        .optional(),
      address: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Address is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Address must be a string.";
            }
            return "Invalid address.";
          },
        })
        .optional(),
      notes: z
        .string({
          error: (iss) => {
            if (!iss.input) {
              return "Notes are required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Notes must be a string.";
            }
            return "Invalid notes.";
          },
        })
        .optional(),
      status: z
        .enum(["active", "inactive"], {
          error: (iss) => {
            if (!iss.input) {
              return "Status is required.";
            } else if (typeof iss.input !== iss.expected) {
              return "Status must be a string.";
            }
            return "Invalid status.";
          },
        })
        .default("active"),
    })
    .strict(),
});
