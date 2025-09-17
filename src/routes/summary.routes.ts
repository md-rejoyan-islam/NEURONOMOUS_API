import { Router } from "express";
import summaryController from "../controllers/summary.controller";
import { isLoggedIn } from "../middlewares/verify";

const summaryRouter = Router();

summaryRouter.use(isLoggedIn);

summaryRouter.get("/dashboard", summaryController.dashboardPageSummary);
summaryRouter.get(
  "/download/clock-devices",
  summaryController.downloadClockDevicesSummary
);
summaryRouter.get(
  "/download/attendance-devices",
  summaryController.downloadAttendanceDevicesSummary
);
summaryRouter.get(
  "/download/students",
  summaryController.downloadStudentsSummary
);

export default summaryRouter;
