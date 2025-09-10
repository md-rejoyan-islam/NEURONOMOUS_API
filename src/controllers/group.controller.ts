import { Response } from "express";
import createError from "http-errors";
import { Types } from "mongoose";
import { IRequestWithUser } from "../app/types";
import { DeviceModel } from "../models/device.model";
import { GroupModel } from "../models/group.model";
import {
  cancelScheduledNoticeService,
  scheduleNoticeService,
} from "../services/device.service";
import {
  addAttendanceDeviceToGroupService,
  addDeviceToGroupService,
  addUserToGroupService,
  bulkChangeGroupDevicesModeService,
  bulkChangeGroupDevicesNoticeService,
  getAllDevicesInGroupService,
  getAllGroupsService,
  getAllUsersInGroupService,
  getGroupByIdService,
  removeDeviceFromGroupService,
  sendNoticeToAllDevicesServiceInGroup,
  updateGroupByIdService,
} from "../services/group.service";
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
export const getAllGroups = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const groups = await getAllGroupsService();

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

export const addUserToGroupWithDevicesPermission = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      notes,
      is_guest,
      deviceIds = [],
    } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const { _id: userId, role } = req.user!;

    const group = await addUserToGroupService(groupId, userId, role, {
      email,
      password,
      first_name,
      last_name,
      deviceIds,
      phone,
      is_guest,
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
export const updateGroupById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { name, description } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }
    const group = await updateGroupByIdService(groupId, {
      name,
      description,
    });
    successResponse(res, {
      message: "Group updated successfully",
      payload: {
        data: group,
      },
    });
  }
);

/**
 * @description Get group by id controller
 * @method GET
 * @route /api/v1/groups/:groupId
 * @access Private
 */
export const getGroupById = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await getGroupByIdService(groupId);

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

export const addDeviceToGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { deviceId, name, location } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await addDeviceToGroupService(
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

export const addAttendanceDeviceToGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { deviceId } = req.body;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const group = await addAttendanceDeviceToGroupService(groupId, deviceId);

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

export const removeDeviceFromGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId, deviceId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }
    const group = await removeDeviceFromGroupService(groupId, deviceId);

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

export const bulkChangeGroupDevicesMode = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { mode, deviceIds = [] } = req.body;

    const group = await bulkChangeGroupDevicesModeService(groupId, {
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

export const bulkChangeGroupDevicesNotice = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    const { notice, deviceIds = [] } = req.body;

    const group = await bulkChangeGroupDevicesNoticeService(groupId, {
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

export const getAllUsersInGroup = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;

    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    // Find the group and populate its members
    const group = await getAllUsersInGroupService(groupId);

    successResponse(res, {
      message: "Users in group retrieved successfully",
      payload: {
        data: group.members,
      },
    });
  }
);

// Get all groups devices
export const getGroupDevices = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { groupId } = req.params;
    if (!isValidMongoId(groupId)) {
      throw createError(400, "Invalid group ID.");
    }

    const devices = await getAllDevicesInGroupService(groupId);

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
export const sendNoticeToAllDevicesInGroup = async (
  req: IRequestWithUser,
  res: Response
) => {
  const { groupId } = req.params;
  const { notice, duration } = req.body;

  // Assuming a service to send notice to all devices exists
  await sendNoticeToAllDevicesServiceInGroup(groupId, notice, duration);

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

export const scheduleNoticeForDeviceInGroup = async (
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

  if (!group.devices.includes(new Types.ObjectId(deviceId))) {
    throw createError(404, "Device not found in this group.");
  }

  await scheduleNoticeService(deviceId, notice, startTime, endTime);

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
export const scheduleNoticeForAllDevicesInGroup = async (
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

  const devices = await DeviceModel.find({
    _id: { $in: group.devices },
  })
    .select("id")
    .lean();

  for (const device of devices) {
    await scheduleNoticeService(device.id, notice, startTime, endTime);
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
export const cancelScheduledNoticeForDeviceInGroup = async (
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

  if (!group.devices.includes(new Types.ObjectId(deviceId))) {
    throw createError(404, "Device not found in this group.");
  }

  await cancelScheduledNoticeService(deviceId, scheduledId);
  successResponse(res, {
    message: `Scheduled notice with ID ${scheduledId} for device ${deviceId} cancelled successfully`,
    statusCode: 200,
  });
};
