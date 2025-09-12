import { Router } from "express";

import authController from "../controllers/auth.controller";
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
authRouter.post(
  "/create-user",
  validate(createUserSchema),
  authController.createUser
); // COMPLETE

// User login route
authRouter.post(
  "/login",
  isLoggedOut,
  validate(loginSchema),
  authController.authLogin
);

// forgot password route
authRouter.post(
  "/forgot-password",
  isLoggedOut,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
// reset password route
authRouter.post(
  "/reset-password",
  isLoggedOut,
  validate(resetPasswordSchema),
  authController.resetPassword
);
// refresh token route
authRouter.post(
  "/refresh-token",
  isLoggedOut,
  validate(refreshTokenSchema),
  authController.refreshToken
);

// user logout route
authRouter.post("/logout", isLoggedIn, authController.authLogout);
// get user profile route
authRouter.get("/profile", isLoggedIn, authController.authProfile);

// update auth profile route
authRouter.patch(
  "/profile",
  isLoggedIn,
  validate(updateAuthProfileSchema),
  authController.updateAuthProfile
);

// get user all access devices list route
authRouter.get(
  "/devices-permission",
  isLoggedIn,
  authController.getUserPermissionDevices
);

// change password route
authRouter.patch(
  "/change-password",
  isLoggedIn,
  validate(changePasswordSchema),
  authController.changePassword
);

export default authRouter;
