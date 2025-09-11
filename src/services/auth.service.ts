import bcrypt from "bcryptjs";
import createError from "http-errors";
import { Types } from "mongoose";
import secret from "../app/secret";
import { IJwtPayload, IUser } from "../app/types";
import forgotPasswordMail from "../mails/forgot-password-mail";
import resetPasswordMail from "../mails/reset-password-mail";
import { ClockDeviceModel } from "../models/clock.model";
import { UserModel } from "../models/user.model";
import { generateRandomPin } from "../utils/generate-random-pin";
import generateToken, { verifyToken } from "../utils/generate-token";
import { logger } from "../utils/logger";
import { comparePassword } from "../utils/password";

// auth login service
export const authLoginService = async (email: string, password: string) => {
  // Find user by email
  const user = await UserModel.findOne({
    email: email.toLowerCase(),
  }).select("password status role first_name last_name ");

  if (!user) throw createError(404, "User not found.");
  if (user.status !== "active") {
    throw createError(403, "User is inactive. Please contact support.");
  }

  // Compare password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw createError(401, "Wrong email or password.");

  // generate loginCode
  const loginCode = generateRandomPin(7);

  // Generate access token
  const accessToken = generateToken(
    {
      loginCode,
      role: user.role,
      _id: user._id.toString(),
    },
    {
      secret: secret.jwt.accessTokenSecret,
      expiresIn: secret.jwt.accessTokenExpiresIn,
    }
  );
  // generate refresh token
  const refreshToken = generateToken(
    {
      loginCode,
      role: user.role,
      _id: user._id.toString(),
    },
    {
      secret: secret.jwt.refreshTokenSecret,
      expiresIn: secret.jwt.refreshTokenExpiresIn,
    }
  );

  // Update last login timestamp
  user.refresh_token = refreshToken;
  user.last_login = Date.now();
  user.reset_code = null; // Clear reset code if user logs in
  user.reset_code_expires = null; // Clear reset code expiration if user logs in
  await user.save();

  // emitInvalidateOtherSessions(user._id.toString());

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      last_login: user.last_login,
    },
  };
};

// forgot password service
export const forgotPasswordService = async (email: string) => {
  // Find user by email
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) throw createError(404, "User not found.");

  if (user.status !== "active")
    throw createError(403, "User is inactive. Please contact support.");

  // password reset code generation
  const resetCode = generateRandomPin(7).toString();

  // Hash the reset code for secure storage in the database
  const saltRounds = await bcrypt.genSalt(10);
  const hashedResetCode = await bcrypt.hash(resetCode, saltRounds);

  // Save the HASHED code and its expiration to the user's record
  user.reset_code = hashedResetCode;
  user.reset_code_expires = secret.passwordResetCodeExpiresIn;

  await user.save();

  // send reset code to user's email
  try {
    await forgotPasswordMail({
      to: user.email,
      name: user.first_name + " " + user.last_name,
      resetCode,
    });
    logger.info({
      message: `Forgot password email sent to ${user.email}`,
      status: 200,
    });
  } catch (error) {
    logger.error({
      message: `Failed to send forgot password email to ${user.email}`,
      status: 500,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : "No stack trace available",
    });
  }
};

// reset password service
export const resetPasswordService = async (
  email: string,
  resetCode: string,
  newPassword: string
) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
    "reset_code reset_code_expires password email first_name last_name"
  );

  if (!user) throw createError(404, "User not found.");

  if (!user.reset_code || !user.reset_code_expires)
    throw createError(400, "Reset code not set for this user");

  const isCodeValid = await bcrypt.compare(
    resetCode.toString(),
    user.reset_code
  );
  const now = Date.now();

  if (!isCodeValid || user.reset_code_expires < now) {
    throw createError(400, "Invalid or expired reset code.");
  }

  user.password = newPassword;

  user.reset_code = null;
  user.reset_code_expires = null;
  await user.save();

  // Send confirmation email
  try {
    await resetPasswordMail({
      to: user.email,
      name: user.first_name + " " + user.last_name,
    });
    logger.info({
      messaege: `Reset password confirmation email sent to ${user.email}`,
      status: 200,
    });
  } catch (error) {
    logger.error({
      message: `Failed to send reset password confirmation email to ${user.email}`,
      status: 500,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : "No stack trace available",
    });
  }
};

// change password service
export const changePasswordService = async (
  userId: Types.ObjectId,
  currentPassword: string,
  newPassword: string
) => {
  // Find user by ID
  const user = await UserModel.findById(userId).select("password status");
  if (!user) throw createError(404, "User not found.");

  if (user.status !== "active") {
    throw createError(403, "User is inactive. Please contact support.");
  }

  // Compare current password
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw createError(401, "Current password is incorrect.");

  // Update password
  user.password = newPassword;
  user.last_login = Date.now();
  await user.save();
};

// auth profile service
export const authProfileService = async (
  userId: Types.ObjectId,
  fields?: string
) => {
  // Find user by ID
  const user = await UserModel.findById(userId)
    .select(fields ? fields.split(",").join(" ") : "-__v -updatedAt")
    .lean();
  if (!user) throw createError(404, "User not found.");

  return user;
};

// logout service
export const authLogoutService = async (userId: Types.ObjectId) => {
  // Find user by ID
  UserModel.findByIdAndUpdate(
    userId,
    {
      refresh_token: null,
      last_login: Date.now(), // Update last login timestamp
      reset_code: null,
      reset_code_expires: null,
    },
    { new: true }
  ).exec();

  return true;
};

// getUserPermissionDevicesService
export const getUserPermissionDevicesService = async (
  userId: Types.ObjectId,
  role: "admin" | "superadmin" | "user"
) => {
  if (role === "superadmin") {
    const devices = await ClockDeviceModel.find({})
      .select("_id name status")
      .lean();
    return devices || [];
  }

  const devices = await ClockDeviceModel.find({
    allowed_users: {
      $in: userId,
    },
  })
    .select("_id id name status")
    .lean();

  return devices || [];
};

// update auth profile service
export const updateAuthProfileService = async (
  userId: Types.ObjectId,
  payload: IUser
) => {
  // Not allowed fields
  const notAllowedFields = [
    "role",
    "status",
    "email",
    "password",
    "reset_code",
    "reset_code_expires",
  ];
  for (const field of notAllowedFields) {
    if (field in payload) {
      throw createError(400, `Field '${field}' cannot be updated.`);
    }
  }

  // Find user by ID
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      ...payload,
      last_login: Date.now(),
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
  if (!user) throw createError(404, "User not found.");

  return user;
};

// refresh token service
export const refreshTokenService = async (refreshToken: string) => {
  console.log(refreshToken);

  // Verify the refresh token
  const payload = verifyToken(
    refreshToken,
    secret.jwt.refreshTokenSecret
  ) as IJwtPayload;

  console.log(payload);

  if (!payload) throw createError(401, "Invalid refresh token.");

  // Find user by ID
  const user = await UserModel.findById(payload._id)
    .select("refresh_token role")
    .lean();

  if (!user) throw createError(404, "User not found.");

  if (user.refresh_token !== refreshToken) {
    throw createError(401, "Invalid refresh token.");
  }

  // Generate new access token
  const accessToken = generateToken(
    {
      loginCode: payload.loginCode,
      role: user.role,
      _id: user._id.toString(),
    },
    {
      secret: secret.jwt.accessTokenSecret,
      expiresIn: secret.jwt.accessTokenExpiresIn,
    }
  );

  return {
    accessToken,
  };
};

// create a new user service
export const createUserService = async (userData: IUser) => {
  // Check if user already exists
  const existingUser = await UserModel.findOne({
    email: userData.email.toLowerCase(),
  });

  // If user exists, throw an error
  if (existingUser) throw createError(409, "User already exists.");

  // Create new user
  const user = new UserModel({
    ...userData,
    email: userData.email.toLowerCase(),
    password: userData.password,
  });

  await user.save();

  return user;
};
