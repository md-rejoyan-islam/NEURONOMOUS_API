import mongoose from "mongoose";
import { IPagination } from "../app/types";
import { CourseModel } from "../models/course.model";
import StudentModel from "../models/student.model";

const getAllStudentsSummary = async ({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const query: {
    $or?: Array<
      | { name: { $regex: string; $options: string } }
      | { email: { $regex: string; $options: string } }
      | { registration_number: { $regex: string; $options: string } }
      | { rfid: { $regex: string; $options: string } }
    >;
  } = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { registration_number: { $regex: search, $options: "i" } },
      { rfid: { $regex: search, $options: "i" } },
    ];
  }

  const pipeline: mongoose.PipelineStage[] = [
    // Stage 1: Filter students based on search query
    {
      $match: query,
    },
    // Stage 2: Look up enrolled courses for each student
    {
      $lookup: {
        from: "courses", // The collection name for CourseModel
        localField: "_id",
        foreignField: "enrolled_students",
        as: "enrolledCourses",
      },
    },
    // Stage 3: Calculate the total number of courses and retaken courses
    {
      $addFields: {
        total_courses: { $size: "$enrolledCourses" },
        retaken_courses: {
          $size: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$enrolledCourses",
                        as: "otherCourse",
                        cond: {
                          $and: [
                            {
                              $eq: ["$$course.course", "$$otherCourse.course"],
                            },
                            { $ne: ["$$course._id", "$$otherCourse._id"] },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
    // Stage 4: Project the required fields and calculate attendance stats
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        registration_number: 1,
        rfid: 1,
        session: 1,
        department: 1,
        total_courses: 1,
        retaken_courses: 1,
        total_classes_attended: {
          $sum: {
            $map: {
              input: "$enrolledCourses",
              as: "course",
              in: {
                $size: {
                  $filter: {
                    input: "$$course.records",
                    as: "record",
                    cond: {
                      $in: ["$_id", "$$record.present_students.student"],
                    },
                  },
                },
              },
            },
          },
        },
        total_classes_held: {
          $sum: {
            $map: {
              input: "$enrolledCourses",
              as: "course",
              in: { $size: "$$course.records" },
            },
          },
        },
      },
    },
    // Stage 5: Add missed classes and performance percentage
    {
      $addFields: {
        total_classes_missed: {
          $subtract: ["$total_classes_held", "$total_classes_attended"],
        },
        performance_percentage: {
          $cond: {
            if: { $eq: ["$total_classes_held", 0] },
            then: 0,
            else: {
              $multiply: [
                {
                  $divide: ["$total_classes_attended", "$total_classes_held"],
                },
                100,
              ],
            },
          },
        },
      },
    },
    // Stage 6: Sort, skip, and limit for pagination
    { $sort: { name: 1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    // Stage 7: Populate department after aggregation
    {
      $lookup: {
        from: "groups", // The collection name for Group model
        localField: "department",
        foreignField: "_id",
        as: "department",
      },
    },
    { $unwind: "$department" },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        registration_number: 1,
        rfid: 1,
        session: 1,
        "department.name": 1,
        "department.eiin": 1,
        total_courses: 1,
        retaken_courses: 1,
        total_classes_attended: 1,
        total_classes_held: 1,
        total_classes_missed: 1,
        performance_percentage: { $round: ["$performance_percentage", 2] },
      },
    },
  ];

  const students = await StudentModel.aggregate(pipeline);
  const totalStudents = await StudentModel.countDocuments(query);

  const pagination: IPagination = {
    items: totalStudents,
    page: page,
    limit: limit,
    totalPages: Math.ceil(totalStudents / limit),
  };

  return { pagination, students };
};

const getStudentAllCourses = async (studentId: string) => {
  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  // Find the student and select only the required fields
  const student = await StudentModel.findById(studentObjectId)
    .select("name registration_number email session")
    .lean();

  if (!student) {
    throw new Error("Student not found");
  }

  // Aggregate courses to calculate attendance stats for the specific student
  const coursesWithStats = await CourseModel.aggregate([
    // Stage 1: Filter courses where the student is enrolled
    {
      $match: {
        enrolled_students: studentObjectId,
      },
    },
    // Stage 2: Populate the course details from the DepartmentCourse collection
    {
      $lookup: {
        from: "departmentcourses", // The collection name for DepartmentCourseModel
        localField: "course",
        foreignField: "_id",
        as: "courseInfo",
      },
    },
    // Stage 3: Deconstruct the courseInfo array
    {
      $unwind: "$courseInfo",
    },
    // Stage 4: Project the final output with calculated attendance
    {
      $project: {
        _id: 1,
        name: "$courseInfo.name",
        code: "$courseInfo.code",
        session: 1,
        total_class: {
          $size: "$records", // Count the total number of records (classes held)
        },
        attend: {
          $sum: {
            $map: {
              input: "$records",
              as: "record",
              in: {
                $cond: [
                  {
                    $in: [studentObjectId, "$$record.present_students.student"],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      },
    },
    // Stage 5: Add absent classes and attendance percentage
    {
      $addFields: {
        absent: {
          $subtract: ["$total_class", "$attend"],
        },
        percentage: {
          $cond: {
            if: { $eq: ["$total_class", 0] },
            then: 0,
            else: {
              $multiply: [{ $divide: ["$attend", "$total_class"] }, 100],
            },
          },
        },
      },
    },
  ]);

  return {
    name: student.name,
    registration_number: student.registration_number,
    email: student.email,
    session: student.session,
    courses: coursesWithStats,
  };
};

const studentService = {
  getAllStudentsSummary,
  getStudentAllCourses,
};

export default studentService;
