import { Router } from "express";
import courseController from "../controllers/course.controller";

const openAccessRouter = Router();

openAccessRouter.get(
  "/course-enroll/:courseId",
  courseController.getCourseEnrollmentDataByCourseId
);
openAccessRouter.post(
  "/course-enroll/:courseId",
  courseController.enrollInCourseByRegistrationNumber
);

export default openAccessRouter;
