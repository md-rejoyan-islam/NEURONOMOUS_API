import { Router } from "express";
import {
  authLogin,
  authLogout,
  authProfile,
  changePassword,
  createUser,
  forgotPassword,
  getUserPermissionDevices,
  refreshToken,
  resetPassword,
  updateAuthProfile,
} from "../controllers/auth.controller";
import validate from "../middlewares/validate";
import { isLoggedIn, isLoggedOut } from "../middlewares/verify";
import {
  changePasswordSchema,
  createUserSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  updateAuthProfileSchema,
} from "../validator/auth.validator";

const authRouter = Router();

// create user route for testing purposes
authRouter.post("/create-user", validate(createUserSchema), createUser);

// User login route
authRouter.post("/login", isLoggedOut, validate(loginSchema), authLogin); // recheck COMPLETE
// forgot password route
authRouter.post(
  "/forgot-password",
  isLoggedOut,
  validate(forgotPasswordSchema),
  forgotPassword
); // recheck COMPLETE
// reset password route
authRouter.post(
  "/reset-password",
  isLoggedOut,
  validate(resetPasswordSchema),
  resetPassword
); // recheck COMPLETE
// refresh token route
authRouter.post(
  "/refresh-token",
  isLoggedOut,
  validate(refreshTokenSchema),
  refreshToken
); // recheck COMPLETE

// user logout route
authRouter.post("/logout", isLoggedIn, authLogout); // recheck COMPLETE
// get user profile route
authRouter.get("/profile", isLoggedIn, authProfile); // recheck COMPLETE

// update auth profile route
authRouter.patch(
  "/profile",
  isLoggedIn,
  validate(updateAuthProfileSchema),
  updateAuthProfile
); // recheck COMPLETE

// get user all access devices list route
authRouter.get("/devices-permission", isLoggedIn, getUserPermissionDevices); // recheck COMPLETE

// change password route
authRouter.patch(
  "/change-password",
  isLoggedIn,
  validate(changePasswordSchema),
  changePassword
); // recheck COMPLETE

export default authRouter;
