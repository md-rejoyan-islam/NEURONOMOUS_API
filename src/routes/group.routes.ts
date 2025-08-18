import { Router } from "express";
import {
  addDeviceToGroup,
  addUserToGroupWithDevicesPermission,
  bulkChangeGroupDevicesMode,
  bulkChangeGroupDevicesNotice,
  cancelScheduledNoticeForDeviceInGroup,
  getAllGroups,
  getAllUsersInGroup,
  getGroupById,
  getGroupDevices,
  removeDeviceFromGroup,
  scheduleNoticeForAllDevicesInGroup,
  scheduleNoticeForDeviceInGroup,
  sendNoticeToAllDevicesInGroup,
  updateGroupById,
} from "../controllers/group.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  addDeviceToGroupSchema,
  addUserToGroupWithDevicesPermissionSchema,
  updateGroupSchema,
} from "../validator/group.validator";

const groupRouter = Router();

// protect all routes
groupRouter.use(isLoggedIn);

// get all groups by superadmin
groupRouter.get("/", authorize(["superadmin"]), getAllGroups); // COMPLETE

// get group by id
groupRouter.get("/:groupId", authorize(["superadmin"]), getGroupById); // COMPLETE

// update groups by superadmin
groupRouter.patch(
  "/:groupId",
  authorize(["superadmin"]),
  validate(updateGroupSchema),
  updateGroupById
); // COMPLETE

// add device to group
groupRouter.post(
  "/:groupId/add-device",
  authorize(["admin", "superadmin"]),
  validate(addDeviceToGroupSchema),
  addDeviceToGroup
); // COMPLETE

// add user to group and give device access
groupRouter.post(
  "/:groupId/add-user",
  authorize(["admin", "superadmin"]),
  validate(addUserToGroupWithDevicesPermissionSchema),
  addUserToGroupWithDevicesPermission
); // COMPLETE

// bulk change group devices mode
groupRouter.post(
  "/:groupId/bulk-change-mode",
  authorize(["admin", "superadmin"]),
  bulkChangeGroupDevicesMode
);

// bulk change group devices notice
groupRouter.post(
  "/:groupId/bulk-change-notice",
  authorize(["admin", "superadmin"]),
  bulkChangeGroupDevicesNotice
);
// get all users in a group
groupRouter.get(
  "/:groupId/users",
  authorize(["admin", "superadmin"]),
  getAllUsersInGroup
); // COMPLETE

// Get all groups devices
groupRouter.get(
  "/:groupId/devices",
  authorize(["admin", "superadmin"]),
  getGroupDevices
); // COMPLETE

// send notice to all devices in a group
groupRouter.post(
  "/:groupId/send-notice",
  authorize(["admin", "superadmin"]),
  sendNoticeToAllDevicesInGroup
);

// schedule notice for all devices in a group
groupRouter.post(
  "/:groupId/schedule-notices",
  authorize(["admin", "superadmin"]),
  scheduleNoticeForAllDevicesInGroup
);

// schedule notice for a specific device in a group
groupRouter.post(
  "/:groupId/schedule-notices/:deviceId",
  authorize(["admin", "superadmin"]),
  scheduleNoticeForDeviceInGroup
);

// remove a device from a group
groupRouter.delete(
  "/:groupId/remove-device/:deviceId",
  authorize(["superadmin"]),
  removeDeviceFromGroup
);

// cancle scheduled notice for a specific device in a group
groupRouter.post(
  "/:groupId/cancel-scheduled-notices/:deviceId",
  authorize(["admin", "superadmin"]),
  cancelScheduledNoticeForDeviceInGroup
);

export default groupRouter;
