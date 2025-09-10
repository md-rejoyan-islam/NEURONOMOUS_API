import { Router } from "express";
import {
  addAttendanceDeviceToGroup,
  addDeviceToGroup,
  addUserToGroupWithDevicesPermission,
  bulkChangeGroupDevicesMode,
  bulkChangeGroupDevicesNotice,
  cancelScheduledNoticeForDeviceInGroup,
  deleteGroupById,
  getAllGroups,
  getAllGroupsForCourse,
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
  addAttendanceDeviceToGroupSchema,
  addDeviceToGroupSchema,
  addUserToGroupWithDevicesPermissionSchema,
  updateGroupSchema,
} from "../validator/group.validator";

const groupRouter = Router();

// protect all routes
groupRouter.use(isLoggedIn);

// get all groups by superadmin
groupRouter.get("/", authorize(["superadmin"]), getAllGroups); // COMPLETE

// get all groups for create course
groupRouter.get("/all-groups", getAllGroupsForCourse); // COMPLETE

// get group by id
groupRouter.get("/:groupId", authorize(["superadmin"]), getGroupById); // COMPLETE

// update groups by superadmin
groupRouter.patch(
  "/:groupId",
  authorize(["superadmin"]),
  validate(updateGroupSchema),
  updateGroupById
); // COMPLETE

groupRouter.delete("/:groupId", authorize(["superadmin"]), deleteGroupById); // COMPLETE

// add device to group
groupRouter.post(
  "/:groupId/add-clock-device",
  authorize(["admin", "superadmin"]),
  validate(addDeviceToGroupSchema),
  addDeviceToGroup
); // COMPLETE

// add attendance device to group
groupRouter.post(
  "/:groupId/add-attendace-device",
  authorize(["admin", "superadmin"]),
  validate(addAttendanceDeviceToGroupSchema),
  addAttendanceDeviceToGroup
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
