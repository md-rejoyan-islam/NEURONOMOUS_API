import { Router } from "express";
import userController from "../controllers/user.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  changeUserPasswordSchema,
  createAdminUserWithGroupSchema,
  updateUserProfileSchema,
} from "../validator/user.validator";

const userRouter = Router();

// protect all routes
userRouter.use(isLoggedIn);

// get all users for superadmin
userRouter.get("/", authorize(["superadmin"]), userController.getAllUsers); // COMPLETE

// create admin user with group by superadmin
userRouter.post(
  "/create-admin",
  authorize(["superadmin"]),
  validate(createAdminUserWithGroupSchema),
  userController.createAdminUserWithGroup
); // COMPLETE

// get user by superadmin/admin
userRouter.get(
  "/:userId",
  authorize(["admin", "superadmin"]),
  userController.getUserById
); // COMPLETE

// delete user by superadmin/admin
userRouter.delete(
  "/:userId",
  authorize(["admin", "superadmin"]),
  userController.deleteUserById
); // COMPLETE

// update user profile by superadmin/admin
userRouter.patch(
  "/:userId",
  authorize(["admin", "superadmin"]),
  validate(updateUserProfileSchema),
  userController.updateUserProfile
);

// change user password by superadmin/admin
userRouter.patch(
  "/:userId/change-password",
  authorize(["admin", "superadmin"]),
  validate(changeUserPasswordSchema),
  userController.changeUserPassword
); // COMPLETE

// ban a user by superadmin/admin
userRouter.patch(
  "/:userId/ban",
  authorize(["admin", "superadmin"]),
  userController.banUserById
); // COMPLETE
// unban a user by superadmin/admin
userRouter.patch(
  "/:userId/unban",
  authorize(["admin", "superadmin"]),
  userController.unbanUserById
); // COMPLETE

// give device access to user by superadmin/admin
userRouter.patch(
  "/:userId/give-device-access",
  authorize(["admin", "superadmin"]),
  userController.giveDevicesAccessToUserInGroup
);
// remove device access from user by superadmin/admin
userRouter.patch(
  "/:userId/revoke-device-access",
  authorize(["admin", "superadmin"]),
  userController.revokeDeviceAccessToUserInGroup
);

// create user with devices acccess by superadmin/admin
// userRouter.post(
//   "/create-user-with-devices",
//   authorize(["admin", "superadmin"]),
//   createUserWithDeviceAcces
// );

export default userRouter;
