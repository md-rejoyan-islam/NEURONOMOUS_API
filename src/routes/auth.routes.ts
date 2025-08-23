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
authRouter.post("/create-user", validate(createUserSchema), createUser); // COMPLETE

// User login route
authRouter.post("/login", isLoggedOut, validate(loginSchema), authLogin);

// forgot password route
authRouter.post(
  "/forgot-password",
  isLoggedOut,
  validate(forgotPasswordSchema),
  forgotPassword
);
// reset password route
authRouter.post(
  "/reset-password",
  isLoggedOut,
  validate(resetPasswordSchema),
  resetPassword
);
// refresh token route
authRouter.post(
  "/refresh-token",
  isLoggedOut,
  validate(refreshTokenSchema),
  refreshToken
);

// user logout route
authRouter.post("/logout", isLoggedIn, authLogout);
// get user profile route
authRouter.get("/profile", isLoggedIn, authProfile);

// update auth profile route
authRouter.patch(
  "/profile",
  isLoggedIn,
  validate(updateAuthProfileSchema),
  updateAuthProfile
);

// get user all access devices list route
authRouter.get("/devices-permission", isLoggedIn, getUserPermissionDevices);

// change password route
authRouter.patch(
  "/change-password",
  isLoggedIn,
  validate(changePasswordSchema),
  changePassword
);

export default authRouter;
