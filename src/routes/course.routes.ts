import { Router } from "express";

import courseController from "../controllers/course.controller";
import validate from "../middlewares/validate";
import { createCourseSchema } from "../validator/course.validator";

const courseRouter = Router();

courseRouter.post(
  "/",
  validate(createCourseSchema),
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

// get all courses in a group/department

// create only course

// assign instcutor in course

// get instractor all course

// get all courses by device id

export default courseRouter;
