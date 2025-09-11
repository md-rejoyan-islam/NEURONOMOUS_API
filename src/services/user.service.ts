import createError from "http-errors";
import { Types } from "mongoose";
import { IGroup, IUser } from "../app/types";
import accountCreatedMail from "../mails/account-create-mail";
import { ClockDeviceModel } from "../models/clock.model";
import { GroupModel } from "../models/group.model";
import { UserModel } from "../models/user.model";
import { logger } from "../utils/logger";

// get all users service
export const getAllUsersService = async (): Promise<IUser[]> => {
  const users = await UserModel.find().select("-password -__v");

  return users;
};

// get user by ID service
export const getUserByIdService = async (userId: string): Promise<IUser> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw createError(404, "User not found");
  }
  return user;
};

// change user password service
export const changeUserPasswordService = async (
  userId: string,
  role: string,
  newPassword: string
): Promise<IUser> => {
  const user = await UserModel.findById(userId).select("-password -__v");

  if (!user) {
    throw createError(404, "User not found.");
  }

  if (user.role === "superadmin") {
    throw createError(
      403,
      "You are not allowed to change superadmin password."
    );
  }
  if (role === "admin" && user.role === "admin") {
    throw createError(403, "Admin cannot change another admin's password.");
  }

  // update password
  user.password = newPassword;

  await user.save();

  return user;
};

// ban user by id service
export const banUserByIdService = async (
  userId: string,
  role: "admin" | "superadmin" | "user",
  _id: Types.ObjectId
): Promise<IUser> => {
  const user = await UserModel.findById(userId).select("role _id status");

  if (!user) {
    throw createError(404, "User not found.");
  }

  if (user?.status === "inactive") {
    throw createError(400, "User is already banned.");
  }

  if (user?.role === "superadmin") {
    throw createError(403, "Superadmin cannot be banned.");
  }
  if (role === "admin" && userId !== _id.toString()) {
    throw createError(403, "Admin can only ban themselves.");
  }
  if (role === "admin" && user?.role === "admin") {
    throw createError(403, "Admin cannot ban another admin.");
  }

  user.status = "inactive";
  await user.save();

  return user;
};

// unban user by id service
export const unbanUserByIdService = async (
  userId: string,
  role: "admin" | "superadmin" | "user",
  _id: Types.ObjectId
): Promise<IUser> => {
  const user = await UserModel.findById(userId).select("role _id status");
  if (!user) {
    throw createError(404, "User not found.");
  }
  if (user?.status === "active") {
    throw createError(400, "User is already active.");
  }
  if (role === "admin" && user.role === "admin") {
    throw createError(403, "Admin cannot unban another admin.");
  }

  user.status = "active";
  await user.save();

  return user;
};

// update user profile service
export const updateUserProfileService = async (
  userId: string,
  payload: Partial<IUser>
): Promise<IUser> => {
  // Not allowed fields
  const notAllowedFields = ["role"];

  for (const field of notAllowedFields) {
    if (field in payload) {
      throw createError(400, `Field '${field}' cannot be updated.`);
    }
  }

  // Find user by ID and update profile
  const user = await UserModel.findByIdAndUpdate(userId, payload, {
    new: true,
  }).select("-password -__v");

  if (!user) {
    throw createError(404, "User not found");
  }

  return user;
};

// give device access to user service in group
export const giveDeviceAccessToUserInGroupService = async (
  userId: string,
  groupId: string,
  deviceIds: string[]
): Promise<IUser> => {
  // group check
  const group = await GroupModel.findById(groupId).populate("devices").lean();

  if (!group) {
    throw createError(404, "Group not found");
  }

  // check devices existence in group
  const devicesNotInGroup = deviceIds.filter(
    (deviceId) =>
      !group.devices.some((device) => device._id.toString() === deviceId)
  );

  if (devicesNotInGroup.length > 0) {
    throw createError(
      400,
      `Devices not found in group: ${devicesNotInGroup.join(", ")}`
    );
  }

  // Find user by ID and update device access
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $addToSet: { devices: { $each: deviceIds } } },
    { new: true }
  ).select("-password -__v");

  if (!user) {
    throw createError(404, "User not found");
  }

  return user;
};

// revoke device access from user service in group
export const revokeDeviceAccessToUserInGroupService = async (
  userId: string,
  groupId: string,
  deviceIds: string[]
): Promise<IUser> => {
  // group check
  const group = await GroupModel.findById(groupId).populate("devices").lean();

  if (!group) {
    throw createError(404, "Group not found.");
  }

  // check devices existence in group
  const devicesNotInGroup = deviceIds.filter(
    (deviceId) =>
      !group.devices.some((device) => device._id.toString() === deviceId)
  );

  if (devicesNotInGroup.length > 0) {
    throw createError(
      400,
      `Devices not found in group: ${devicesNotInGroup.join(", ")}`
    );
  }

  // Find user by ID and update device access
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $pull: { devices: { $in: deviceIds } } },
    { new: true }
  )
    .select("-password -__v")
    .lean();

  if (!user) {
    throw createError(404, "User not found");
  }

  return user;
};

// create a admin user + group service
export const createAdminUserWithGroupService = async (payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  group_name: string;
  group_description: string;
  group_eiin: string;
}): Promise<IGroup> => {
  // user  check
  const existingUser = await UserModel.exists({
    email: payload.email.toLowerCase(),
  });
  if (existingUser) {
    throw createError(400, "Email already exists");
  }

  // group check
  const existingGroup = await GroupModel.exists({
    name: payload.group_name,
    eiin: payload.group_eiin,
  });
  if (existingGroup) {
    throw createError(400, "Group with this name or EIIN already exists");
  }

  // Create new admin user
  const newUser = new UserModel({
    email: payload.email.toLowerCase(),
    password: payload.password,
    first_name: payload.first_name,
    last_name: payload.last_name,
    role: "admin",
  });

  // Create a new group for the admin user
  const newGroup = new GroupModel({
    name: payload.group_name,
    description: payload.group_description,
    eiin: payload.group_eiin,
    members: [
      newUser._id, // Add the new user's ID to the group's members
    ],
  });

  // Save the new user
  newUser.group = newGroup._id;
  await newUser.save();

  // Save the new group
  await newGroup.save();

  // send account creation email
  try {
    await accountCreatedMail({
      name: `${newUser.first_name} ${newUser.last_name}`,
      to: newUser.email,
    });
  } catch (error) {
    logger.error({
      message: `Failed to send account creation email to ${newUser.email}`,
      status: 500,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : "No stack trace available",
    });
  }

  return newGroup;
};

// delete user by id service
export const deleteUserByIdService = async (userId: string) => {
  // Find user by ID and delete
  const user = await UserModel.findById(userId).select("role _id status");
  if (!user) {
    throw createError(404, "User not found");
  }

  if (user.role === "superadmin" || user.role === "admin") {
    throw createError(403, `You cannot delete a ${user.role} user.`);
  }

  // Delete user
  await user.deleteOne();

  // remove user from group if exists
  await GroupModel.updateMany(
    { members: user._id },
    { $pull: { members: user._id } }
  );
  // remove user from devices if exists
  await ClockDeviceModel.updateMany(
    { allowed_users: user._id },
    { $pull: { allowed_users: user._id } }
  );
};
