import { Request, Response } from "express";
import { Types } from "mongoose";
import { IRequestWithUser } from "../app/types";
import {
  authLoginService,
  authLogoutService,
  authProfileService,
  changePasswordService,
  createUserService,
  forgotPasswordService,
  getUserPermissionDevicesService,
  refreshTokenService,
  resetPasswordService,
  updateAuthProfileService,
} from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

/**
 * @description User login controller
 * @method POST
 * @route /api/v1/auth/login
 * @access Public
 * @body {email: string, password: string}
 */
export const authLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await authLoginService(
    email,
    password
  );

  successResponse(res, {
    message: "Login successful",
    statusCode: 200,
    payload: {
      data: {
        user,
        refreshToken,
        accessToken,
      },
    },
  });
});

/**
 * @description Forgot password controller
 * @method POST
 * @route /api/v1/auth/forgot-password
 * @access Public
 * @body {email: string}
 */

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    await forgotPasswordService(email);

    successResponse(res, {
      message: "Check your email for the reset code",
      statusCode: 200,
      payload: {
        data: {},
      },
    });
  }
);

/**
 * @description Reset password controller
 * @method POST
 * @route /api/v1/auth/reset-password
 * @access Public
 * @body {email: string, resetCode: string, newPassword: string}
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, resetCode, newPassword } = req.body;

    await resetPasswordService(email, resetCode, newPassword);

    successResponse(res, {
      message: "Password has been reset successfully.",
      statusCode: 200,
      payload: {},
    });
  }
);

/**
 * @description Get user profile controller
 * @method GET
 * @route /api/v1/auth/profile
 * @access Private
 */

export const authProfile = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { fields } = req.query as { fields?: string };

    const user = await authProfileService(
      req.user?._id as Types.ObjectId,
      fields
    );

    successResponse(res, {
      message: "User profile retrieved successfully",
      payload: {
        data: user,
      },
    });
  }
);

// getUserDevices

export const getUserPermissionDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const devices = await getUserPermissionDevicesService(
      req.user?._id as Types.ObjectId,
      req.user?.role as "admin" | "superadmin" | "user"
    );

    successResponse(res, {
      message: "User devices retrieved successfully",
      payload: {
        data: devices,
      },
    });
  }
);

/**
 * @description User logout controller
 * @method POST
 * @route /api/v1/auth/logout
 * @access Private
 */

export const authLogout = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    await authLogoutService(req.user?._id as Types.ObjectId);

    successResponse(res, {
      message: "User logged out successfully",
      payload: {},
    });
  }
);

/**
 * @description Change user password controller
 * @method POST
 * @route /api/v1/auth/change-password
 * @access Private
 * @body {currentPassword: string, newPassword: string}
 */

export const changePassword = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    await changePasswordService(
      req.user?._id as Types.ObjectId,
      currentPassword,
      newPassword
    );

    successResponse(res, {
      message: "Password changed successfully",
      payload: {},
    });
  }
);

/**
 * @description Update user profile controller
 * @method PATCH
 * @route /api/v1/auth/update-profile
 * @access Private
 * @body {name?: string, email?: string}
 */

export const updateAuthProfile = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const user = await updateAuthProfileService(
      req.user?._id as Types.ObjectId,
      req.body
    );

    successResponse(res, {
      message: "Profile updated successfully",
      payload: {
        data: user,
      },
    });
  }
);

/**
 * @description Refresh token controller
 * @method POST
 * @route /api/v1/auth/refresh-token
 * @access public
 * @body {refreshToken: string}
 */

export const refreshToken = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { accessToken } = await refreshTokenService(req.body.refreshToken);

    successResponse(res, {
      message: "Token refreshed successfully",
      payload: {
        data: {
          accessToken,
        },
      },
    });
  }
);

/**
 * @description Create a new user controller for testing purposes
 * @method POST
 * @route /api/v1/auth/create-user
 * @access Public
 */

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserService(req.body);

  successResponse(res, {
    message: "User created successfully",
    payload: {
      data: user,
    },
  });
});
