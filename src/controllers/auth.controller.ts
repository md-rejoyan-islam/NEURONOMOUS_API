import { Request, Response } from "express";
import { Types } from "mongoose";
import { IRequestWithUser } from "../app/types";

import authService from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

/**
 * @description User login controller
 * @method POST
 * @route /api/v1/auth/login
 * @access Public
 * @body {email: string, password: string}
 */
const authLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await authService.authLogin(
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

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  successResponse(res, {
    message: "Check your email for the reset code",
    statusCode: 200,
    payload: {
      data: {},
    },
  });
});

/**
 * @description Reset password controller
 * @method POST
 * @route /api/v1/auth/reset-password
 * @access Public
 * @body {email: string, resetCode: string, newPassword: string}
 */
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, resetCode, newPassword } = req.body;

  await authService.resetPassword(email, resetCode, newPassword);

  successResponse(res, {
    message: "Password has been reset successfully.",
    statusCode: 200,
    payload: {},
  });
});

/**
 * @description Get user profile controller
 * @method GET
 * @route /api/v1/auth/profile
 * @access Private
 */

const authProfile = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { fields } = req.query as { fields?: string };

    const user = await authService.authProfile(
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

const getUserPermissionDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const devices = await authService.getUserPermissionDevices(
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

const authLogout = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    await authService.authLogout(req.user?._id as Types.ObjectId);

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

const changePassword = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
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

const updateAuthProfile = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const user = await authService.updateAuthProfile(
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

const refreshToken = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    console.log("Refreshing token...", req.body.refreshToken);

    const { accessToken } = await authService.refreshToken(
      req.body.refreshToken
    );

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

const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.createUser(req.body);

  successResponse(res, {
    message: "User created successfully",
    payload: {
      data: user,
    },
  });
});

const authController = {
  authLogin,
  forgotPassword,
  resetPassword,
  authProfile,
  authLogout,
  changePassword,
  updateAuthProfile,
  refreshToken,
  createUser,
  getUserPermissionDevices,
};

export default authController;
