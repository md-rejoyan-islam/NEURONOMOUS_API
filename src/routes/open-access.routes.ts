import { Router } from "express";
import courseController from "../controllers/course.controller";
import validate from "../middlewares/validate";
import courseValidator from "../validator/course.validator";

const openAccessRouter = Router();

openAccessRouter.get(
  "/course-enroll/:courseId",
  courseController.getCourseEnrollmentDataByCourseId
);
openAccessRouter.post(
  "/course-enroll/:courseId",
  courseController.enrollInCourseByRegistrationNumber
);

openAccessRouter.get(
  "/device-courses/:deviceId",
  courseController.getDeviceAllCoursesById
);

openAccessRouter.post(
  "/add-attendance/from-device/:courseId",
  validate(courseValidator.addAttendanceByDeviceSchema),
  courseController.addAttendanceRecordByDevice
);

export default openAccessRouter;
