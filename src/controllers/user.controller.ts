import { Request, Response } from "express";
import createError from "http-errors";
import { Types } from "mongoose";
import { IRequestWithUser } from "../app/types";
import userService from "../services/user.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

/**
 * @description Get all users controller for super admin
 * @method GET
 * @route /api/v1/users
 * @access Private
 * @returns {Array<IUser>} List of users
 */
const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();

  successResponse(res, {
    message: "Users retrieved successfully",
    statusCode: 200,
    payload: {
      data: users,
    },
  });
});

/**
 * @description Change user password controller by superadmin/admin
 * @method POST
 * @route /api/v1/users/:userId/change-password
 * @access Private
 * @param {string} userId - The ID of the user whose password will be changed
 * @body {newPassword: string} - The new password for the user
 * @returns {IUser} Updated user object
 */

const changeUserPassword = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!req.user) {
      throw new Error("User not authenticated.");
    }

    const { role } = req.user;

    const user = await userService.changeUserPassword(
      userId,
      role,
      newPassword
    );

    successResponse(res, {
      message: `User ${userId} password changed successfully`,
      statusCode: 200,
      payload: {
        data: user,
      },
    });
  }
);

/**
 * @description Ban a user controller by superadmin/admin
 * @method POST
 * @route /api/v1/users/:userId/ban
 * @access Private
 * @param {string} userId - The ID of the user to be banned
 * @returns {IUser} Updated user object with ban status
 */

const banUserById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { userId } = req.params;

    if (!req.user) {
      throw new Error("User not authenticated.");
    }
    const { role, _id } = req.user;

    if (!Types.ObjectId.isValid(userId)) {
      throw createError(400, "Invalid user ID.");
    }

    const user = await userService.banUserById(userId, role, _id);

    successResponse(res, {
      message: `User ${userId} banned successfully`,
      statusCode: 200,
      payload: {
        data: user,
      },
    });
  }
);

/**
 * @description Unban a user controller by superadmin/admin
 * @method POST
 * @route /api/v1/users/:userId/unban
 * @access Private
 * @param {string} userId - The ID of the user to be unbanned
 * @returns {IUser} Updated user object with ban status
 */
const unbanUserById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { userId } = req.params;

    if (!req.user) {
      throw new Error("User not authenticated.");
    }
    const { role, _id } = req.user;

    if (!Types.ObjectId.isValid(userId)) {
      throw createError(400, "Invalid user ID.");
    }

    const user = await userService.unbanUserById(userId, role, _id);

    successResponse(res, {
      message: `User ${userId} unbanned successfully`,
      statusCode: 200,
      payload: {
        data: user,
      },
    });
  }
);

/**
 * @description Update user profile controller by admin/superadmin
 * @method PATCH
 * @route /api/v1/users/:userId
 * @access Private
 * @param {string} userId - The ID of the user to be updated
 * @body {name: string, email: string} - The new name and email for the user
 * @returns {IUser} Updated user object
 */

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await userService.updateUserProfile(userId, req.body);
  successResponse(res, {
    message: `User ${userId} profile updated successfully`,
    statusCode: 200,
    payload: {
      data: user,
    },
  });
});

/**
 * @description Give device access to user controller by admin/superadmin
 * @method POST
 * @route /api/v1/users/:userId/give-device-access
 * @access Private
 * @param {string} userId - The ID of the user to whom device access will be given
 * @body {string[]} deviceIds - Array of device IDs to be given access
 * @returns {IUser} Updated user object with device access
 */

const giveDevicesAccessToUserInGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { deviceIds, groupId } = req.body;

    const user = await userService.giveDeviceAccessToUserInGroup(
      userId,
      groupId,
      deviceIds
    );

    successResponse(res, {
      message: `Device access given to user ${userId} successfully`,
      statusCode: 200,
      payload: {
        data: user,
      },
    });
  }
);

/**
 * @description Revoke device access from user controller by admin/superadmin
 * @method POST
 * @route /api/v1/users/:userId/revoke-device-access
 * @access Private
 * @param {string} userId - The ID of the user from whom device access will be revoked
 * @body {string[]} deviceIds - Array of device IDs to be revoked access
 * @returns {IUser} Updated user object with revoked device access
 */
const revokeDeviceAccessToUserInGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { deviceIds, groupId } = req.body;

    const user = await userService.revokeDeviceAccessToUserInGroup(
      userId,
      groupId,
      deviceIds
    );

    successResponse(res, {
      message: `Device access revoked from user ${userId} successfully`,
      statusCode: 200,
      payload: {
        data: user,
      },
    });
  }
);

// /**
//  * @description Create a new user controller by superadmin/admin with device access
//  * @method POST
//  * @route /api/v1/users/create-user
//  * @access Private
//  * @body {name: string, email: string, password: string, deviceIds: string[]} - The new user's details and device access
//  * @returns {IUser} Created user object with device access
//  */

// const createUserWithDeviceAccessInGroup = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { name, email, password, deviceIds ,groupId} = req.body;

//     // Create new user with device access
//     const newUser = new UserModel({
//       name,
//       email,
//       password,
//       devices: deviceIds,
//     });

//     await newUser.save();

//     successResponse(res, {
//       message: "User created successfully with device access",
//       payload: {
//         data: newUser,
//       },
//     });
//   }
// );

/**
 * @description Create a admin by superadmin
 * @method POST
 * @route /api/v1/users/create-admin
 * @access Private
 * @body {name: string, email: string, password: string} - The new admin's details
 * @returns {IUser} Created admin object
 */

const createAdminUserWithGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      first_name,
      last_name,
      email,
      password,
      group_name,
      group_description,
      group_eiin,
    } = req.body;

    const user = await userService.createAdminUserWithGroup({
      email,
      password,
      first_name,
      last_name,
      group_name,
      group_description,
      group_eiin,
    });

    successResponse(res, {
      message: "Admin created successfully",
      statusCode: 201,
      payload: {
        data: user,
      },
    });
  }
);

/**
 * @description Delete a user controller by superadmin/admin
 * @method DELETE
 * @route /api/v1/users/:userId
 * @access Private
 * @param {string} userId - The ID of the user to be deleted
 * @returns {IUser} Deleted user object
 */
const deleteUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Find user by ID and delete
  await userService.deleteUserById(userId);
  successResponse(res, {
    message: `User ${userId} deleted successfully`,
    statusCode: 200,
    payload: {},
  });
});

// get user by superadmin/admin
const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!Types.ObjectId.isValid(userId)) {
    throw createError(400, "Invalid user ID.");
  }

  const user = await userService.getUserById(userId);

  successResponse(res, {
    message: `User ${userId} retrieved successfully`,
    statusCode: 200,
    payload: {
      data: user,
    },
  });
});

const userController = {
  getAllUsers,
  changeUserPassword,
  banUserById,
  unbanUserById,
  updateUserProfile,
  giveDevicesAccessToUserInGroup,
  revokeDeviceAccessToUserInGroup,
  // createUserWithDeviceAccessInGroup,
  createAdminUserWithGroup,
  deleteUserById,
  getUserById,
};

export default userController;
