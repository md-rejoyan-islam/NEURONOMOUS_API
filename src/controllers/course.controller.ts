import { Request, Response } from "express";
import createError from "http-errors";
import { IRequestWithUser } from "../app/types";
import courseService from "../services/course.service";
import { asyncHandler } from "../utils/async-handler";
import { isValidMongoId } from "../utils/is-valid-mongo-id";
import { successResponse } from "../utils/response-handler";

const createNewCourse = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const course = await courseService.createNewCourse({
      courseId: req.body.courseId,
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

const getAllCourses = asyncHandler(async (req: Request, res: Response) => {
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

  const courses = await courseService.getAllCourses({
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
});

// get all courses in a group/department
const getAllCoursesByGroupId = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "",
      payload: {
        pagination: {},
        data: [],
      },
    });
  }
);

// create only course
const createCourseByGroupAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "",
      payload: {
        pagination: {},
        data: [],
      },
    });
  }
);

// get instractor all course
const getAllCoursesByInstcurtorId = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(res, {
      statusCode: 200,
      message: "Course enrollment data fetched successfully",
      payload: {
        data: [],
      },
    });
  }
);

// get course enrollment data
const getCourseEnrollmentDataByCourseId = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    const course = await courseService.getCourseEnrollmentDataByCourseId(
      req.params.courseId
    );
    successResponse(res, {
      statusCode: 200,
      message: "Course enrollment data fetched successfully",
      payload: {
        data: course,
      },
    });
  }
);

// course enroll by registaton number
const enrollInCourseByRegistrationNumber = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!req.body.registration_number) {
      throw createError.BadRequest("Registration number is required.");
    }

    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    const result = await courseService.enrollInCourseByRegistrationNumber(
      req.params.courseId,
      req.body.registration_number
    );

    successResponse(res, {
      statusCode: 200,
      message: "Successfully enrolled in the course",
      payload: {
        data: result,
      },
    });
  }
);

const getCourseById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    const course = await courseService.getCourseById(req.params.courseId);
    successResponse(res, {
      statusCode: 200,
      message: "Course fetched successfully",
      payload: {
        data: course,
      },
    });
  }
);

const getEnrolledStudentsByCourseId = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    const course = await courseService.getEnrolledStudentsByCourseId({
      courseId: req.params.courseId,
      search: req.query.search as string,
    });
    successResponse(res, {
      statusCode: 200,
      message: "Enrolled students fetched successfully",
      payload: {
        data: course,
      },
    });
  }
);

const addAttendanceRecordByDevice = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    if (!req.body.date) {
      throw createError.BadRequest("Date is required.");
    }

    const course = await courseService.addAttendanceRecordByDevice({
      courseId: req.params.courseId,
      deviceId: req.body.deviceId,
      date: req.body.date,
      records: req.body.records,
    });
    successResponse(res, {
      statusCode: 200,
      message: "Attendance record added successfully",
      payload: {
        data: course,
      },
    });
  }
);

const addAttendanceRecordByInstaructore = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    if (!req.body.date) {
      throw createError.BadRequest("Date is required.");
    }

    const course = await courseService.addAttendanceRecordByInstaructore({
      courseId: req.params.courseId,
      date: req.body.date,
    });
    successResponse(res, {
      statusCode: 200,
      message: "Attendance record added successfully",
      payload: {
        data: course,
      },
    });
  }
);

const manuallyToggleAttendanceRecord = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    if (!req.body.date) {
      throw createError.BadRequest("Date is required.");
    }

    if (!isValidMongoId(req.body.studentId)) {
      throw createError.BadRequest("Invalid student ID.");
    }

    const course = await courseService.manuallyToggleAttendanceRecord({
      courseId: req.params.courseId,
      date: req.body.date,
      studentId: req.body.studentId,
    });
    successResponse(res, {
      statusCode: 200,
      message: "Attendance record toggled successfully",
      payload: {
        data: course,
      },
    });
  }
);

const getCourseAttendanceRecordByDate = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    if (!isValidMongoId(req.params.courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    if (!req.params.date || typeof req.params.date !== "string") {
      throw createError.BadRequest("Date is required and must be a string.");
    }

    const course = await courseService.getCourseAttendanceRecordByDate(
      req.params.courseId,
      req.params.date
    );
    successResponse(res, {
      statusCode: 200,
      message: "Attendance record fetched successfully",
      payload: {
        data: course,
      },
    });
  }
);

const courseController = {
  getCourseAttendanceRecordByDate,

  createNewCourse,
  getEnrolledStudentsByCourseId,
  getCourseById,
  enrollInCourseByRegistrationNumber,
  getAllCourses,
  getAllCoursesByGroupId,
  createCourseByGroupAdmin,
  getAllCoursesByInstcurtorId,
  getCourseEnrollmentDataByCourseId,
  addAttendanceRecordByDevice,
  addAttendanceRecordByInstaructore,
  manuallyToggleAttendanceRecord,
};

export default courseController;
