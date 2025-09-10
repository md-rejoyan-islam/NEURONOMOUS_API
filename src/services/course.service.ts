import secret from "../app/secret";
import { CourseModel } from "../models/course.model";
import { GroupModel } from "../models/group.model";
import { UserModel } from "../models/user.model";

export const createNewCourseService = async ({
  code,
  name,
  session,
  department,
  instructor,
}: {
  code: string;
  name: string;
  session: string;
  department: string;
  instructor: string;
}) => {
  const existingCourse = await CourseModel.findOne({ code, session });
  if (existingCourse) {
    throw new Error("A course with the same code and session already exists.");
  }

  // instrcutor and department id check
  const courseInstructor = await UserModel.exists({
    _id: instructor,
  });
  if (!courseInstructor) {
    throw new Error("Instructor not found.");
  }

  const departmentExists = await GroupModel.exists({
    _id: department,
  });
  if (!departmentExists) {
    throw new Error("Department not found.");
  }

  const course = new CourseModel({
    code,
    name,
    session,
    department,
    instructor,
  });
  course.enroll_link = secret.client_url + "/course-enroll/" + course._id;

  await course.save();

  // To be implemented
  return course;
};

export const getAllCoursesService = async (filter: {
  instructorId?: string;
  departmentId?: string;
  session?: string;
  code?: string;
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
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
  } = filter;

  const query: {
    instructor?: string;
    department?: string;
    session?: string;
    code?: { $regex: string; $options: string };
    name?: { $regex: string; $options: string };
  } = {};

  if (instructorId) {
    query.instructor = instructorId;
  }
  if (departmentId) {
    query.department = departmentId;
  }
  if (session) {
    query.session = session;
  }
  if (code) {
    query.code = { $regex: code, $options: "i" };
  }
  if (name) {
    query.name = { $regex: name, $options: "i" }; // case-insensitive partial match
  }

  const courses = await CourseModel.find(query)
    .select("-__v -createdAt -updatedAt")
    .populate<{
      instructor: {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
      department: { _id: string; name: string; eiin: string };
    }>("instructor", "first_name last_name email")
    .populate<{
      department: { _id: string; name: string; eiin: string };
    }>("department", "name eiin")
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const totalCourses = await CourseModel.countDocuments(query);

  const totalPages = Math.ceil(totalCourses / limit);

  // return with pagination info
  const pagination = {
    totalItems: totalCourses,
    totalPages,
    currentPage: page,
    pageSize: limit,
  };

  return {
    pagination,
    courses,
  };
};
