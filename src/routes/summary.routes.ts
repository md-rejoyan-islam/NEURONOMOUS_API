import { Router } from "express";
import summaryController from "../controllers/summary.controller";
import { authorize } from "../middlewares/authorized";
import { isLoggedIn } from "../middlewares/verify";

const summaryRouter = Router();

summaryRouter.use(isLoggedIn);

summaryRouter.get("/dashboard", summaryController.dashboardPageSummary);
summaryRouter.get(
  "/download/clock-devices",
  authorize(["superadmin"]),
  summaryController.downloadClockDevicesSummary
);
summaryRouter.get(
  "/download/attendance-devices",
  authorize(["superadmin"]),
  summaryController.downloadAttendanceDevicesSummary
);
summaryRouter.get(
  "/download/students",
  authorize(["superadmin", "admin"]),
  summaryController.downloadStudentsSummary
);
summaryRouter.get(
  "/all-groups",
  authorize(["superadmin"]),
  summaryController.getAllGroupSummaries
);

export default summaryRouter;
