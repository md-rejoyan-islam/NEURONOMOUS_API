import express from "express";
import studentController from "../controllers/student.controller";

const studentRouter = express.Router();

studentRouter.get("/summary", studentController.getAllStudentsSummary);
studentRouter.get(
  "/:studentId/courses",
  studentController.getStudentAllCourses
);

export default studentRouter;
