import bcrypt from "bcryptjs";
import createError from "http-errors";
import { Types } from "mongoose";
import secret from "../app/secret";
import forgotPasswordMail from "../mails/forgot-password-mail";
import resetPasswordMail from "../mails/reset-password-mail";
import { UserModel } from "../models/user.model";
import { emitInvalidateOtherSessions } from "../socket";
import { generateRandomPin } from "../utils/generate-random-pin";
import generateToken, { verifyToken } from "../utils/generate-token";
import { errorLogger } from "../utils/logger";
import { comparePassword } from "../utils/password";
import { IUser } from "../utils/types";

// auth login service
export const authLoginService = async (email: string, password: string) => {
  // Find user by email
  const user = await UserModel.findOne({
    email: email.toLowerCase(),
  });

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
  user.refresh_token = refreshToken; // Store refresh token in user document
  user.last_login = Date.now();
  user.reset_code = null; // Clear reset code if user logs in
  user.reset_code_expires = null; // Clear reset code expiration if user logs in
  await user.save();

  emitInvalidateOtherSessions(user._id.toString());

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address: user.address,
      notes: user.notes,
      status: user.status,
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
  const resetCode = generateRandomPin(7);

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
  } catch (error) {
    errorLogger.error(
      `Failed to send forgot password email to ${user.email}: ${error}`
    );
  }
};

// reset password service
export const resetPasswordService = async (
  email: string,
  resetCode: string,
  newPassword: string
) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });

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
  await resetPasswordMail({
    to: user.email,
    name: user.first_name + " " + user.last_name,
  });
};

// change password service
export const changePasswordService = async (
  userId: Types.ObjectId,
  currentPassword: string,
  newPassword: string
) => {
  // Find user by ID
  const user = await UserModel.findById(userId);
  if (!user) throw createError(404, "User not found.");

  // Compare current password
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw createError(401, "Current password is incorrect.");

  // Update password
  user.password = newPassword;
  user.last_login = Date.now();
  await user.save();

  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    address: user.address,
    notes: user.notes,
    status: user.status,
    last_login: user.last_login,
  };
};

// logout service
export const authLogoutService = async (userId: Types.ObjectId) => {
  // Find user by ID
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { refresh_token: null }, // Clear refresh token
    { new: true }
  ).lean();
  if (!user) throw createError(404, "User not found.");

  return true;
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
  )
    .select("-password -__v -createdAt -updatedAt")
    .lean();
  if (!user) throw createError(404, "User not found.");

  return user;
};

// refresh token service
export const refreshTokenService = async (refreshToken: string) => {
  // Verify the refresh token
  const payload = verifyToken(refreshToken, secret.jwt.refreshTokenSecret) as {
    _id: Types.ObjectId;
    loginCode: string;
    role: string;
  };

  if (!payload) throw createError(401, "Invalid refresh token.");

  // Find user by ID
  const user = await UserModel.findById(payload._id).lean();

  if (!user) throw createError(404, "User not found.");

  if (user.refresh_token !== refreshToken) {
    throw createError(401, "Invalid refresh token.");
  }

  // Generate new access token
  const accessToken = generateToken(
    {
      loginCode: payload.loginCode,
      // email: user.email,
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
