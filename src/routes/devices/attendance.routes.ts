import { Router } from "express";
import {
  addAttendanceDeviceInGroup,
  getAllAttendanceDevices,
  getAttendanceDeviceById,
  getAttendanceDevicesByGroupId,
  giveAttendanceDevicePermissionByInstuctorId,
  removeAttendanceDeviceFromGroupById,
  revolkAttendanceDevicePermissionByInstuctorId,
} from "../../controllers/devices/attendance.controller";
import { authorize } from "../../middlewares/authorized";
import validate from "../../middlewares/validate";
import { isLoggedIn } from "../../middlewares/verify";
import { addAttendanceDeviceToGroupSchema } from "../../validator/group.validator";

const attendanceRouter = Router();

attendanceRouter.use(isLoggedIn);

attendanceRouter.get("/", getAllAttendanceDevices);

attendanceRouter.get("/:deviceId", getAttendanceDeviceById); // To be implemented

// get all attendance device for group
attendanceRouter.get("/group/:groupId", getAttendanceDevicesByGroupId);

// add attendance device in group
attendanceRouter.post(
  "/group/:groupId",
  authorize(["admin", "superadmin"]),
  validate(addAttendanceDeviceToGroupSchema),
  addAttendanceDeviceInGroup
);
// remove attendace device from group
attendanceRouter.delete("/group/:groupId", removeAttendanceDeviceFromGroupById);
// give instuctor permission in attendance device
attendanceRouter.post(
  "/group/:groupId/instuctor/:instructorId",
  giveAttendanceDevicePermissionByInstuctorId
);
// revolk instuctor permission in attendance device
attendanceRouter.delete(
  "/group/:groupId/instuctor/:instructorId",
  revolkAttendanceDevicePermissionByInstuctorId
);

export default attendanceRouter;
