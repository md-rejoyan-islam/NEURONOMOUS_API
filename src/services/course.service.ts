import mongoose, { Types } from "mongoose";
import secret from "../app/secret";
import { CourseModel } from "../models/course.model";
import { GroupModel } from "../models/group.model";
import StudentModel from "../models/student.model";
import { UserModel } from "../models/user.model";

const createNewCourse = async ({
  courseId,
  session,
  department,
  instructor,
}: {
  courseId: string;
  session: string;
  department: string;
  instructor: string;
}) => {
  const departCourse = await GroupModel.findById(department).populate<{
    courses: {
      _id: string;
      code: string;
      name: string;
    }[];
  }>("courses", "code name");

  if (!departCourse) {
    throw new Error("Department not found.");
  }

  const courseInDepartment = departCourse.courses.find(
    (course) => course._id.toString() === courseId
  );

  if (!courseInDepartment) {
    throw new Error("Course not found in the specified department.");
  }

  const existingCourse = await CourseModel.findOne({
    code: courseInDepartment.code,
    session,
  });
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
    code: courseInDepartment.code,
    name: courseInDepartment.name,
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
    query.name = { $regex: name, $options: "i" };
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
    registration_number: registrationNumber,
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
const addAttendanceRecordByDevice = async ({
  courseId,
  deviceId,
  date,
  records,
}: {
  courseId: string;
  deviceId: string;
  date: string;
  records: {
    studentId: string;
    timestamp: Date;
  }[];
}) => {
  console.log(deviceId);

  const course = await CourseModel.findById(courseId);

  if (!course) {
    throw new Error("Course not found.");
  }

  // check if attendance for the date already exists
  const existingRecord = course.records.find((record) => record.date === date);
  if (existingRecord) {
    throw new Error("Attendance for this date already exists.");
  }

  // check student ids
  for (const record of records) {
    if (!Types.ObjectId.isValid(record.studentId)) {
      throw new Error(`Invalid student ID: ${record.studentId}`);
    }
    const studentExists = await StudentModel.exists({
      _id: record.studentId,
    });
    if (!studentExists) {
      throw new Error(`Student not found with ID: ${record.studentId}`);
    }
  }

  // check enrolled students
  for (const record of records) {
    if (
      !course.enrolled_students.includes(new Types.ObjectId(record.studentId))
    ) {
      throw new Error(
        `Student with ID: ${record.studentId} is not enrolled in this course.`
      );
    }
  }

  // add attendance record
  const now = new Date();
  course.records.push({
    recordId: new mongoose.Types.ObjectId(),
    date,
    present_students: records.map((r) => ({
      presentId: new mongoose.Types.ObjectId(),
      student: new Types.ObjectId(r.studentId),
      presentBy: "device",
    })),
    createdAt: now,
    updatedAt: now,
  });

  await course.save();
};

const addAttendanceRecordByInstaructore = async ({
  courseId,
  date,
}: {
  courseId: string;
  date: string;
}) => {
  const course = await CourseModel.findById(courseId);

  if (!course) {
    throw new Error("Course not found.");
  }

  // check if attendance for the date already exists
  const existingRecord = course.records.find((record) => record.date === date);
  if (existingRecord) {
    throw new Error("Attendance for this date already exists.");
  }

  const now = new Date();
  course.records.push({
    recordId: new mongoose.Types.ObjectId(),
    date,
    present_students: [],
    createdAt: now,
    updatedAt: now,
  });
  await course.save();

  return {};
};

const manuallyToggleAttendanceRecord = async ({
  courseId,
  date,
  studentId,
}: {
  courseId: string;
  date: string;
  studentId: string;
}) => {
  const course = await CourseModel.findById(courseId);

  if (!course) {
    throw new Error("Course not found.");
  }

  const record = course.records.find((r) => r.date === date);
  if (!record) {
    throw new Error("Attendance record not found for the given date.");
  }

  if (!Types.ObjectId.isValid(studentId)) {
    throw new Error(`Invalid student ID: ${studentId}`);
  }
  const studentExists = await StudentModel.exists({
    _id: studentId,
  });
  if (!studentExists) {
    throw new Error(`Student not found with ID: ${studentId}`);
  }
  if (!course.enrolled_students.includes(new Types.ObjectId(studentId))) {
    throw new Error(
      `Student with ID: ${studentId} is not enrolled in this course.`
    );
  }
  if (
    record.present_students.find((ps) => ps.student.toString() === studentId)
  ) {
    record.present_students = record.present_students.filter(
      (ps) => ps.student.toString() !== studentId
    );
  } else {
    record.present_students.push({
      presentId: new mongoose.Types.ObjectId(),
      student: new Types.ObjectId(studentId),
      presentBy: "instructor",
    });
  }

  record.updatedAt = new Date();
  await course.save();
};

const getCourseAttendanceRecordByDate = async (
  courseId: string,
  date: string
) => {
  const course = await CourseModel.findById(courseId)
    .populate("enrolled_students")
    .populate(
      "records.present_students.student",
      "name email session registration_number"
    )
    .lean();

  if (!course) {
    throw new Error("Course not found.");
  }
  const record = course.records.find((r) => r.date === date);
  if (!record) {
    throw new Error("Attendance record not found for the given date.");
  }

  return {
    _id: course._id,
    code: course.code,
    name: course.name,
    date: record.date,
    present_students: record.present_students,
    enrolled_students: course.enrolled_students,
  };
};

const courseService = {
  getEnrolledStudentsByCourseId,
  createNewCourse,
  getCourseById,
  getCourseEnrollmentDataByCourseId,
  enrollInCourseByRegistrationNumber,
  getAllCourses,
  addAttendanceRecordByDevice,
  addAttendanceRecordByInstaructore,
  manuallyToggleAttendanceRecord,
  getCourseAttendanceRecordByDate,
};
export default courseService;
