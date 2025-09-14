import { Response } from "express";
import createError from "http-errors";
import { Types } from "mongoose";
import { IRequestWithUser } from "../app/types";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { GroupModel } from "../models/group.model";
import clockService from "../services/devices/clock.service";

import groupService from "../services/group.service";
import { asyncHandler } from "../utils/async-handler";
import { isValidMongoId } from "../utils/is-valid-mongo-id";
import { successResponse } from "../utils/response-handler";

/**
 * @description Get all groups controller for super admin
 * @method GET
 * @route /api/v1/groups
 * @access Private
 * @returns {Array<IGroup>} List of groups
 */
const getAllGroups = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const {
      name,
      eiin,
      search = "",
      limit = 10,
      page = 1,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const { pagination, groups } = await groupService.getAllGroups({
      name: name as string,
      eiin: eiin as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: String(sortBy),
      search: String(search),
      order: String(order) === "asc" ? 1 : -1,
    });

    successResponse(res, {
      message: "Groups retrieved successfully",
      payload: {
        pagination,
        data: groups,
      },
    });
  }
);

const getAllGroupsForCourse = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const groups = await groupService.getAllGroupsForCourse();
    console.log(groups);

    successResponse(res, {
      message: "Groups retrieved successfully",
      payload: {
        data: groups,
      },
    });
  }
);

/**
 * @description Add user to a group controller and give device access
 * @method POST
 * @route /api/v1/groups/:groupId/add-user
 * @access Private
 * @param {string} groupId - The ID of the group to which the user will be added
 * @body {email,passwod,first_name,last_name,deviceIds} - User details and device IDs
 * @returns {IGroup} Updated group with new members
 */

const addUserToGroupWithDevicesPermission = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      notes,
      deviceType,
      deviceIds = [],
    } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const { _id: userId, role } = req.user!;

    const group = await groupService.addUserToGroupWithDevices(
      groupId,
      userId,
      role,
      {
        email,
        password,
        first_name,
        last_name,
        deviceIds,
        deviceType,
        phone,
        notes,
      }
    );

    successResponse(res, {
      message: "Users added to group successfully",
      payload: {
        data: group,
      },
    });
  }
);
const addUserToGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { email, password, first_name, last_name, phone, notes } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const { _id: userId, role } = req.user!;

    const group = await groupService.addUserToGroup(groupId, role, userId, {
      email,
      password,
      first_name,
      last_name,
      phone,
      notes,
    });

    successResponse(res, {
      message: "Users added to group successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Update group by id controller
 * @method PATCH
 * @route /api/v1/groups/:groupId
 * @access Private
 */
const updateGroupById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { name, description, eiin } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }
    const group = await groupService.updateGroupById(groupId, {
      name,
      description,
      eiin,
    });
    successResponse(res, {
      message: "Group updated successfully",
      payload: {
        data: group,
      },
    });
  }
);

const deleteGroupById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }
    await groupService.deleteGroupById(groupId);
    successResponse(res, {
      message: "Group updated successfully",
      payload: {},
    });
  }
);

/**
 * @description Get group by id controller
 * @method GET
 * @route /api/v1/groups/:groupId
 * @access Private
 */
const getGroupById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await groupService.getGroupById(groupId);

    successResponse(res, {
      message: "Group retrieved successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Add device to group controller
 * @method POST
 * @route /api/v1/groups/:groupId/add-device
 * @access Private
 * @param {string} groupId - The ID of the group to which the device will be added
 * @body {string} deviceId - The ID of the device to be added
 * @returns {IGroup} Updated group with new devices
 */

const addDeviceToGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { deviceId, name, location } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await groupService.addDeviceToGroup(
      groupId,
      deviceId,
      name,
      location
    );

    successResponse(res, {
      message: "Device added to group successfully",
      payload: {
        data: group,
      },
    });
  }
);

const addAttendanceDeviceToGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { deviceId } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await groupService.addAttendanceDeviceToGroup(
      groupId,
      deviceId
    );

    successResponse(res, {
      message: "Device added to group successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Remove a device from a group controller
 * @method DELETE
 * @route /api/v1/groups/:groupId/remove-device/:deviceId
 * @access Private
 */

const removeDeviceFromGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId, deviceId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }
    const group = await groupService.removeDeviceFromGroup(groupId, deviceId);

    successResponse(res, {
      message: "Device removed from group successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Change bulk device mode
 * @method POST
 * @route /api/v1/groups/:groupId/bulk-change-mode
 * @access Private
 * @param {string} groupId - The ID of the group whose devices will be updated
 * @body {string} mode - The new mode to set for all devices in the group
 * @returns {IGroup} Updated group with devices in the new mode
 */

const bulkChangeGroupDevicesMode = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { mode, deviceIds = [] } = req.body;

    const group = await groupService.bulkChangeGroupDevicesMode(groupId, {
      mode,
      deviceIds,
    });

    successResponse(res, {
      message: "Devices mode updated successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Change bulk device notice
 * @method POST
 * @route /api/v1/groups/:groupId/bulk-change-notice
 * @access Private
 * @param {string} groupId - The ID of the group whose devices will be updated
 * @body {string} notice - The new notice to set for all devices in the group
 * @returns {IGroup} Updated group with devices in the new notice
 */

const bulkChangeGroupDevicesNotice = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { notice, deviceIds = [] } = req.body;

    const group = await groupService.bulkChangeGroupDevicesNotice(groupId, {
      notice,
      deviceIds,
    });

    successResponse(res, {
      message: "Devices notice updated successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Get all users in a group
 * @method GET
 * @route /api/v1/groups/:groupId/users
 * @access Private
 * @param {string} groupId - The ID of the group whose users will be fetched
 * @returns {Array<IUser>} List of users in the group
 */

const getAllUsersInGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    // Find the group and populate its members
    const group = await groupService.getAllUsersInGroup(groupId);

    successResponse(res, {
      message: "Users in group retrieved successfully",
      payload: {
        data: group.members,
      },
    });
  }
);

// Get all groups devices
const getGroupDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const devices = await groupService.getAllDevicesInGroup(groupId);

    successResponse(res, {
      message: "Devices in group retrieved successfully",
      payload: {
        data: devices,
      },
    });
  }
);

/**
 * @description Send notice to all devices in a group.
 * @method POST
 * @route /api/v1/groups/:groupId/send-notice
 */
const sendNoticeToAllDevicesInGroup = async (
  req: IRequestWithUser,
  res: Response
) => {
  const { groupId } = req.params;
  const { notice, duration } = req.body;

  // Assuming a service to send notice to all devices exists
  await groupService.sendNoticeToAllDevicesServiceInGroup(
    groupId,
    notice,
    duration
  );

  successResponse(res, {
    message: "Notice sent to all devices successfully",
    statusCode: 200,
  });
};

/**
 * @description Send scheduled notice to a specific device in a group.
 * @method POST
 * @route /api/v1/groups/:groupId/schedule-notices/:deviceId
 */

const scheduleNoticeForDeviceInGroup = async (
  req: IRequestWithUser,
  res: Response
) => {
  const { groupId, deviceId } = req.params;
  const { notice, startTime, endTime } = req.body;

  const group = await GroupModel.findById(groupId)
    .select("devices")
    .populate("devices");
  if (!group) {
    throw createError(404, "Group not found.");
  }

  if (
    !group.devices.some(
      () => ({
        deviceId: new Types.ObjectId(deviceId),
        deviceType: "clock",
      })
      // !group.devices.includes({
      //   deviceId: new Types.ObjectId(deviceId),
      //   deviceType: "clock",
      // })
    )
  ) {
    throw createError(404, "Device not found in this group.");
  }

  await clockService.scheduleNotice(deviceId, notice, startTime, endTime);

  successResponse(res, {
    message: `Notice scheduled for device ${deviceId}`,
    statusCode: 200,
  });
};

/**
 * @description Schedule notice for all devices.
 * @method POST
 * @route /api/v1/groups/:groupId/schedule-notices
 */
const scheduleNoticeForAllDevicesInGroup = async (
  req: IRequestWithUser,
  res: Response
) => {
  const { groupId } = req.params;

  const { notice, startTime, endTime } = req.body;

  const group = await GroupModel.findById(groupId)
    .select("devices")
    .populate("devices")
    .lean();
  if (!group) {
    throw createError(404, "Group not found.");
  }

  const devices = await ClockDeviceModel.find({
    _id: { $in: group.devices },
  })
    .select("id")
    .lean();

  for (const device of devices) {
    await clockService.scheduleNotice(device.id, notice, startTime, endTime);
  }

  successResponse(res, {
    message: "Notice scheduled for all devices successfully",
    statusCode: 200,
  });
};

/**
 * @description Cancel a scheduled notice for a specific device in a group.
 * @method DELETE
 * @route /api/v1/groups/:groupId/scheduled-notices/:deviceId
 */
const cancelScheduledNoticeForDeviceInGroup = async (
  req: IRequestWithUser,
  res: Response
) => {
  const { deviceId, groupId } = req.params;
  const { scheduledId } = req.body;
  const group = await GroupModel.findById(groupId)
    .select("devices")
    .populate("devices")
    .lean();
  if (!group) {
    throw createError(404, "Group not found.");
  }

  if (
    !group.devices.some(() => ({
      deviceId: new Types.ObjectId(deviceId),
      deviceType: "clock",
    }))
    // !group.devices.includes({
    //   deviceId: new Types.ObjectId(deviceId),
    //   deviceType: "clock",
    // })
  ) {
    throw createError(404, "Device not found in this group.");
  }

  await clockService.cancelScheduledNotice(deviceId, scheduledId);
  successResponse(res, {
    message: `Scheduled notice with ID ${scheduledId} for device ${deviceId} cancelled successfully`,
    statusCode: 200,
  });
};

const getGroupByIdWithClocks = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const { search = "" } = req.query;

    const group = await groupService.getGroupByIdWithClocks(groupId, {
      search: String(search),
    });

    successResponse(res, {
      message: "Group retrieved successfully",
      payload: {
        data: group,
      },
    });
  }
);

const getGroupByIdWithAttendanceDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const { search = "" } = req.query;

    const group = await groupService.getGroupByIdWithAttendanceDevices(
      groupId,
      {
        search: String(search),
      }
    );

    successResponse(res, {
      message: "Group retrieved successfully",
      payload: {
        data: group,
      },
    });
  }
);

const createCourseForDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }

    const course = await groupService.createCourseForDepartment({
      code: req.body.code,
      name: req.body.name,
      groupId,
    });

    successResponse(res, {
      message: "Successfully created a new course",
      statusCode: 200,
      payload: {
        data: course,
      },
    });
  }
);
const removeCourseFormDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId, courseId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }
    if (!isValidMongoId(courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    const course = await groupService.removeCourseFromDepartment(
      groupId,
      courseId
    );

    successResponse(res, {
      message: "Successfully created a new course",
      statusCode: 200,
      payload: {
        data: course,
      },
    });
  }
);

const editCourseInDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId, courseId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }
    if (!isValidMongoId(courseId)) {
      throw createError.BadRequest("Invalid course ID.");
    }

    const course = await groupService.editCourseInDepartment({
      groupId,
      courseId,
      code: req.body.code,
      name: req.body.name,
    });

    successResponse(res, {
      message: "Course updated successfully",
      statusCode: 200,
      payload: {
        data: course,
      },
    });
  }
);

const getDepartmentCourses = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { search = "" } = req.query;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }

    const courses = await groupService.getDepartmentCourses({
      groupId,
      search: String(search),
    });

    successResponse(res, {
      message: "Courses retrieved successfully",
      statusCode: 200,
      payload: {
        data: courses,
      },
    });
  }
);

const editStudentInDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId, studentId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }
    if (!isValidMongoId(studentId)) {
      throw createError.BadRequest("Invalid student ID.");
    }

    console.log("Request body:", req.body);

    const student = await groupService.editStudentInDepartment(
      groupId,
      studentId,
      {
        name: req.body.name,
        email: req.body.email,
        session: req.body.session,
        registration_number: req.body.registration_number,
        rfid: req.body.rfid,
      }
    );

    successResponse(res, {
      message: "Student updated successfully",
      statusCode: 200,
      payload: {
        data: student,
      },
    });
  }
);

const deleteStudentInDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId, studentId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }
    if (!isValidMongoId(studentId)) {
      throw createError.BadRequest("Invalid student ID.");
    }

    await groupService.deleteStudentFromDepartment(groupId, studentId);

    successResponse(res, {
      message: "Student deleted successfully",
      statusCode: 200,
      payload: {},
    });
  }
);

const getAllStudentsInDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { search = "", limit = 10, page = 1 } = req.query;

    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }

    const result = await groupService.getAllStudentsInDepartment({
      groupId,
      search: String(search),
      limit: Number(limit),
      page: Number(page),
    });

    successResponse(res, {
      message: "Students retrieved successfully",
      statusCode: 200,
      payload: {
        data: result,
      },
    });
  }
);
const createStudentsForDepartment = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    if (!isValidMongoId(groupId)) {
      throw createError.BadRequest("Invalid group ID.");
    }

    console.log("File received:", req.file);
    console.log("Body received:", req.body);

    const file = req.file;

    if (!file) {
      throw createError.BadRequest("No file uploaded.");
    }

    // support only json file
    if (file.mimetype !== "application/json") {
      throw createError.BadRequest("Only JSON files are supported.");
    }

    // parse json file
    let reqBody;
    try {
      reqBody = JSON.parse(file.buffer.toString());
    } catch {
      throw createError.BadRequest("Invalid JSON file.");
    }

    if (!Array.isArray(reqBody) || reqBody.length === 0) {
      throw createError.BadRequest("JSON file is empty or not an array.");
    }

    // validate each object in the array
    for (const item of reqBody) {
      if (
        !item.name ||
        !item.email ||
        !item.session ||
        !item.registration_number ||
        !item.rfid
      ) {
        throw createError.BadRequest(
          "Each student must have name, email, session, registration_number and rfid."
        );
      }
    }

    const student = await groupService.createStudentsForDepartment(
      groupId,
      reqBody
    );

    successResponse(res, {
      message: "Successfully created a new student",
      statusCode: 200,
      payload: {
        data: student,
      },
    });
  }
);

const groupController = {
  editStudentInDepartment,
  deleteStudentInDepartment,
  editCourseInDepartment,
  removeCourseFormDepartment,
  createCourseForDepartment,
  getGroupByIdWithAttendanceDevices,
  getGroupByIdWithClocks,
  getAllGroups,
  getAllGroupsForCourse,
  addUserToGroupWithDevicesPermission,
  updateGroupById,
  deleteGroupById,
  getAllStudentsInDepartment,
  getGroupById,
  addDeviceToGroup,
  addAttendanceDeviceToGroup,
  removeDeviceFromGroup,
  bulkChangeGroupDevicesMode,
  bulkChangeGroupDevicesNotice,
  getAllUsersInGroup,
  getGroupDevices,
  sendNoticeToAllDevicesInGroup,
  scheduleNoticeForDeviceInGroup,
  scheduleNoticeForAllDevicesInGroup,
  cancelScheduledNoticeForDeviceInGroup,
  getDepartmentCourses,
  addUserToGroup,
  createStudentsForDepartment,
};

export default groupController;
