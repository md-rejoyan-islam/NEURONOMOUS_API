import secret from "../app/secret";
import { CourseModel } from "../models/course.model";
import { GroupModel } from "../models/group.model";
import StudentModel from "../models/student.model";
import { UserModel } from "../models/user.model";

const createNewCourse = async ({
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

const getAllCourses = async (filter: {
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

// get course enrollment data
const getCourseEnrollmentDataByCourseId = async (courseId: string) => {
  const course = await CourseModel.findById(courseId)
    .populate<{
      department: { _id: string; name: string; eiin: string };
    }>("department", "name eiin")
    .populate<{
      instructor: { _id: string; first_name: string; last_name: string };
    }>("instructor", "first_name last_name")
    .lean();

  if (!course) {
    throw new Error("Course not found.");
  }

  return {
    _id: course._id,
    code: course.code,
    name: course.name,
    department: course.department.name,
    instructor:
      course.instructor.first_name + " " + course.instructor.last_name,
  };
};

const enrollInCourseByRegistrationNumber = async (
  courseId: string,
  registrationNumber: string
) => {
  // find user by registration number
  const user = await StudentModel.findOne({
    registration_number: +registrationNumber,
  });

  if (!user) {
    throw new Error("Student with this registration number not found.");
  }

  // find course by id
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new Error("Course not found.");
  }

  // check if user is already enrolled
  if (course.enrolled_students.includes(user._id)) {
    throw new Error("You are already enrolled in this course.");
  }

  // enroll user
  course.enrolled_students.push(user._id);
  await course.save();

  return {
    student_name: user.name,
    session: user.session,
  };
};

const getCourseById = async (courseId: string) => {
  const course = await CourseModel.findById(courseId)
    .select("-__v -createdAt")
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
    .lean();

  if (!course) {
    throw new Error("Course not found.");
  }

  return {
    _id: course._id,
    code: course.code,
    name: course.name,
    session: course.session,
    enroll_link: course.enroll_link,
    department: course.department.name,
    instructor:
      course.instructor.first_name + " " + course.instructor.last_name,
    instructor_email: course.instructor.email,
    updatedAt: course.updatedAt,
    studentsEnrolled: course.enrolled_students.length || 0,
    completedClasses: course.records.length || 0,
    records: course.records.map((record) => ({
      _id: record.recordId,
      date: record.date,
      present_students: record.present_students.length,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })),
    attendanceRate:
      course.records.length > 0
        ? (
            (course.records.reduce(
              (acc, record) => acc + record.present_students.length,
              0
            ) /
              (course.records.length *
                (course.enrolled_students.length || 1))) *
            100
          ).toFixed(2) + "%"
        : "N/A",
  };
};

const getEnrolledStudentsByCourseId = async ({
  courseId,
  search,
}: {
  courseId: string;
  search?: string;
}) => {
  const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { registration_number: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const course = await CourseModel.findById(courseId)
    .populate<{
      department: {
        name: string;
      };
    }>("department", "name")
    .populate<{
      enrolled_students: {
        _id: string;
        name: string;
        email: string;
        session: string;
        registration_number: number;
      }[];
    }>({
      path: "enrolled_students",
      select: "name email session registration_number",
      match: searchQuery,
    })
    .lean();

  if (!course) {
    throw new Error("Course not found.");
  }

  return {
    _id: course._id,
    code: course.code,
    name: course.name,
    session: course.session,
    students: course.enrolled_students,
    department: course.department.name,
  };
};

const courseService = {
  getEnrolledStudentsByCourseId,
  createNewCourse,
  getCourseById,
  getCourseEnrollmentDataByCourseId,
  enrollInCourseByRegistrationNumber,
  getAllCourses,
};
export default courseService;
