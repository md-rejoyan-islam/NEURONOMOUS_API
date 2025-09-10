import { Router } from "express";
import {
  createNewCourse,
  getAllCourses,
} from "../controllers/course.controller";
import validate from "../middlewares/validate";
import { createCourseSchema } from "../validator/course.validator";

const courseRouter = Router();

courseRouter.post("/", validate(createCourseSchema), createNewCourse);
courseRouter.get("/", getAllCourses);

export default courseRouter;
