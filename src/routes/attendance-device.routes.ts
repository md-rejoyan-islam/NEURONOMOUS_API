import { Router } from "express";
import {
  getAllAttendanceDevices,
  getAttendanceDeviceById,
} from "../controllers/attendance-device.controller";

const attendanceRouter = Router();

// attendanceRouter.use(isLoggedIn);

attendanceRouter.get("/", getAllAttendanceDevices);
attendanceRouter.get("/:deviceId", getAttendanceDeviceById); // To be implemented

export default attendanceRouter;
