import { Router } from "express";

import groupController from "../controllers/group.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  addUserToGroupWithDevicesPermissionSchema,
  updateGroupSchema,
} from "../validator/group.validator";

const groupRouter = Router();

// protect all routes
groupRouter.use(isLoggedIn);

// get all groups by superadmin
groupRouter.get("/", authorize(["superadmin"]), groupController.getAllGroups); // COMPLETE

// get all groups for create course
groupRouter.get("/all-groups", groupController.getAllGroupsForCourse); // COMPLETE

// get group by id
groupRouter.get(
  "/:groupId",
  authorize(["superadmin"]),
  groupController.getGroupById
); // COMPLETE

// update groups by superadmin
groupRouter.patch(
  "/:groupId",
  authorize(["superadmin"]),
  validate(updateGroupSchema),
  groupController.updateGroupById
); // COMPLETE

groupRouter.delete(
  "/:groupId",
  authorize(["superadmin"]),
  groupController.deleteGroupById
); // COMPLETE

// add device to group
// groupRouter.post(
//   "/:groupId/add-clock-device",
//   authorize(["admin", "superadmin"]),
//   validate(addDeviceToGroupSchema),
//   addDeviceToGroup
// ); // COMPLETE

// // add attendance device to group
// groupRouter.post(
//   "/:groupId/add-attendace-device",
//   authorize(["admin", "superadmin"]),
//   validate(addAttendanceDeviceToGroupSchema),
//   addAttendanceDeviceToGroup
// ); // COMPLETE

// add user to group and give device access
groupRouter.post(
  "/:groupId/add-user",
  authorize(["admin", "superadmin"]),
  validate(addUserToGroupWithDevicesPermissionSchema),
  groupController.addUserToGroupWithDevicesPermission
); // COMPLETE

// get group by id with clocks
groupRouter.get(
  "/:groupId/devices/clocks",
  authorize(["admin", "superadmin"]),
  groupController.getGroupByIdWithClocks
);

// get group by id with attendance devices
groupRouter.get(
  "/:groupId/devices/attendance",
  authorize(["admin", "superadmin"]),
  groupController.getGroupByIdWithAttendanceDevices
);

// bulk change group devices mode
groupRouter.post(
  "/:groupId/bulk-change-mode",
  authorize(["admin", "superadmin"]),
  groupController.bulkChangeGroupDevicesMode
);

// bulk change group devices notice
groupRouter.post(
  "/:groupId/bulk-change-notice",
  authorize(["admin", "superadmin"]),
  groupController.bulkChangeGroupDevicesNotice
);
// get all users in a group
groupRouter.get(
  "/:groupId/users",
  authorize(["admin", "superadmin"]),
  groupController.getAllUsersInGroup
); // COMPLETE

// Get all groups devices
groupRouter.get(
  "/:groupId/devices",
  authorize(["admin", "superadmin"]),
  groupController.getGroupDevices
); // COMPLETE

// send notice to all devices in a group
groupRouter.post(
  "/:groupId/send-notice",
  authorize(["admin", "superadmin"]),
  groupController.sendNoticeToAllDevicesInGroup
);

// schedule notice for all devices in a group
groupRouter.post(
  "/:groupId/schedule-notices",
  authorize(["admin", "superadmin"]),
  groupController.scheduleNoticeForAllDevicesInGroup
);

// schedule notice for a specific device in a group
groupRouter.post(
  "/:groupId/schedule-notices/:deviceId",
  authorize(["admin", "superadmin"]),
  groupController.scheduleNoticeForDeviceInGroup
);

// remove a device from a group
groupRouter.delete(
  "/:groupId/remove-device/:deviceId",
  authorize(["superadmin"]),
  groupController.removeDeviceFromGroup
);

// cancle scheduled notice for a specific device in a group
groupRouter.post(
  "/:groupId/cancel-scheduled-notices/:deviceId",
  authorize(["admin", "superadmin"]),
  groupController.cancelScheduledNoticeForDeviceInGroup
);

export default groupRouter;
