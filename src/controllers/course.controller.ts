import { Request, Response } from "express";
import { IRequestWithUser } from "../app/types";
import {
  createNewCourseService,
  getAllCoursesService,
} from "../services/course.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

export const createNewCourse = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const course = await createNewCourseService({
      code: req.body.code,
      name: req.body.name,
      session: req.body.session,
      department: req.body.department,
      instructor: req.body.instructor,
    });

    successResponse(res, {
      message: "Successfully created a new course",
      statusCode: 201,
      payload: {
        data: course,
      },
    });
  }
);

export const getAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      instructorId,
      departmentId,
      session,
      code,
      name,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const courses = await getAllCoursesService({
      instructorId: instructorId as string,
      departmentId: departmentId as string,
      session: session as string,
      code: code as string,
      name: name as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: String(sortBy),
      sortOrder: String(sortOrder) as "asc" | "desc",
    });

    // to be implemented
    successResponse(res, {
      message: "Not implemented yet",
      statusCode: 501,
      payload: {
        data: courses,
      },
    });
  }
);
