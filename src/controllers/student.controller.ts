import { Request, Response } from "express";
import studentService from "../services/student.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

const getAllStudentsSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const { pagination, students } = await studentService.getAllStudentsSummary(
      {
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
      }
    );

    successResponse(res, {
      message: "Fetched all students summary",
      statusCode: 200,
      payload: {
        pagination,
        data: students,
      },
    });
  }
);

const getStudentAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params;

    const result = await studentService.getStudentAllCourses(studentId);

    successResponse(res, {
      message: "Fetched student and their courses",
      statusCode: 200,
      payload: {
        data: result,
      },
    });
  }
);

const studentController = {
  getAllStudentsSummary,
  getStudentAllCourses,
};

export default studentController;
