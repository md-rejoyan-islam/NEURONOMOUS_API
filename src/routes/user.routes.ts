import { Router } from "express";
import {
  banUserById,
  changeUserPassword,
  createAdminUserWithGroup,
  deleteUserById,
  getAllUsers,
  giveDevicesAccessToUserInGroup,
  revokeDeviceAccessToUserInGroup,
  unbanUserById,
  updateUserProfile,
} from "../controllers/user.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  changeUserPasswordSchema,
  createAdminUserWithGroupSchema,
} from "../validator/user.validator";

const userRouter = Router();

// protect all routes
userRouter.use(isLoggedIn);

// get all users for superadmin
userRouter.get("/", authorize(["superadmin"]), getAllUsers); // COMPLETE

// create admin user with group by superadmin
userRouter.post(
  "/create-admin",
  authorize(["superadmin"]),
  validate(createAdminUserWithGroupSchema),
  createAdminUserWithGroup
); // COMPLETE

// delete user by superadmin/admin
userRouter.delete(
  "/:userId",
  authorize(["admin", "superadmin"]),
  deleteUserById
); // COMPLETE

// change user password by superadmin/admin
userRouter.patch(
  "/:userId/change-password",
  authorize(["admin", "superadmin"]),
  validate(changeUserPasswordSchema),
  changeUserPassword
); // COMPLETE

// ban a user by superadmin/admin
userRouter.patch(
  "/:userId/ban",
  authorize(["admin", "superadmin"]),
  banUserById
); // COMPLETE
// unban a user by superadmin/admin
userRouter.patch(
  "/:userId/unban",
  authorize(["admin", "superadmin"]),
  unbanUserById
); // COMPLETE

// update user profile by superadmin/admin
userRouter.patch(
  "/:userId/update-profile",
  authorize(["admin", "superadmin"]),
  updateUserProfile
);
// give device access to user by superadmin/admin
userRouter.patch(
  "/:userId/give-device-access",
  authorize(["admin", "superadmin"]),
  giveDevicesAccessToUserInGroup
);
// remove device access from user by superadmin/admin
userRouter.patch(
  "/:userId/revoke-device-access",
  authorize(["admin", "superadmin"]),
  revokeDeviceAccessToUserInGroup
);

// create user with devices acccess by superadmin/admin
// userRouter.post(
//   "/create-user-with-devices",
//   authorize(["admin", "superadmin"]),
//   createUserWithDeviceAcces
// );

export default userRouter;
