import { Router } from "express";
import {
  authLogin,
  authLogout,
  authProfile,
  changePassword,
  createUser,
  forgotPassword,
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
// change password route
authRouter.post(
  "/change-password",
  isLoggedIn,
  validate(changePasswordSchema),
  changePassword
);
// update auth profile route
authRouter.patch(
  "/update-profile",
  isLoggedIn,
  validate(updateAuthProfileSchema),
  updateAuthProfile
);

export default authRouter;
