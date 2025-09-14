import { Router } from "express";

import courseController from "../controllers/course.controller";
import validate from "../middlewares/validate";
import courseValidator from "../validator/course.validator";

const courseRouter = Router();

courseRouter.post(
  "/",
  validate(courseValidator.createCourseSchema),
  courseController.createNewCourse
);
courseRouter.get("/", courseController.getAllCourses);

// get course by id
courseRouter.get("/:courseId", courseController.getCourseById);

// get enrolled students by course id
courseRouter.get(
  "/:courseId/enrolled-students",
  courseController.getEnrolledStudentsByCourseId
);

courseRouter.post(
  "/:courseId/attendance-by-device",
  validate(courseValidator.addAttendanceByDeviceSchema),
  courseController.addAttendanceRecordByDevice
);
courseRouter.post(
  "/:courseId/attendance-records",
  validate(courseValidator.addAttendanceByInstaructoreSchema),
  courseController.addAttendanceRecordByInstaructore
);
courseRouter.get(
  "/:courseId/attendance-records/:date",
  courseController.getCourseAttendanceRecordByDate
);
courseRouter.patch(
  "/:courseId/manually-toggle-attendance",
  courseController.manuallyToggleAttendanceRecord
);

// get all courses in a group/department

// create only course

// assign instcutor in course

// get instractor all course

// get all courses by device id

export default courseRouter;
