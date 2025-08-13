import { NextFunction, Response } from "express";
import createError from "http-errors";
import jwt from "jsonwebtoken";
import secret from "../app/secret";
import { IJwtPayload, IRequestWithUser } from "../app/types";
import { UserModel } from "../models/user.model";
import { asyncHandler } from "../utils/async-handler";

export const isLoggedIn = asyncHandler(
  async (req: IRequestWithUser, _res: Response, next: NextFunction) => {
    const token =
      req.headers?.authorization?.split("Bearer ")[1] || req.cookies?.token;

    if (!token || token === "null") {
      throw createError.Unauthorized("Please login to access this resource.");
    }

    const decoded = jwt.verify(
      token,
      secret.jwt.accessTokenSecret
    ) as IJwtPayload;
    const user = await UserModel.findById(decoded._id)
      .select("-password -__v -createdAt -updatedAt")
      .lean();

    if (!user) {
      throw createError.Unauthorized(
        "Login User not found or no longer exists!"
      );
    }

    // check user if login from another device or not
    if (user.refresh_token) {
      const refreshDecoded = jwt.verify(
        user.refresh_token,
        secret.jwt.refreshTokenSecret
      ) as IJwtPayload;

      const isValidLoginCode = refreshDecoded.loginCode === decoded.loginCode;
      if (!isValidLoginCode) {
        throw createError.Unauthorized("Can't login in multiple device.");
      }
    }

    req.user = user;
    next();
  }
);

export const isLoggedOut = asyncHandler(
  async (req: IRequestWithUser, _res: Response, next: NextFunction) => {
    const authHeader = req.headers?.authorization;
    const token = authHeader?.split(" ")[1];

    // check token
    const isValid = jwt.decode(token as string);

    if (isValid) {
      throw createError.Unauthorized("You are already logged in");
    }

    next();
  }
);
