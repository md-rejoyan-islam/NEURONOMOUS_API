import { Router } from "express";
import { getAllAttendanceDevices } from "../controllers/attendance-device.controller";

const attendanceRouter = Router();

// attendanceRouter.use(isLoggedIn);

attendanceRouter.get("/", getAllAttendanceDevices);

export default attendanceRouter;
