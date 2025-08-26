import { Router } from "express";

import {
  cancelScheduledNoticeForDevice,
  changeAllDevicesMode,
  changeFontAndTimeFormat,
  changeSingleDeviceMode,
  getAllDevices,
  getAllowedUsersForDevice,
  getAvailableFontsInDevice,
  getDeviceById,
  getScheduledNoticeInDevice,
  giveDeviceAccessToUsersInGroup,
  restartDeviceById,
  revokeDeviceAccessFromUser,
  scheduleNoticeForAllDevices,
  scheduleNoticeForDevice,
  sendNoticeInDevice,
  sendNoticeToAllDevices,
  updateDeviceFirmware,
} from "../controllers/device.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  changeDeviceModeSchema,
  changeSelectedDeviceModeSchema,
  giveDeviceAccessToUsersSchema,
  scheduleNoticeForDeviceSchema,
  sendNoticeToDeviceSchema,
  sendNoticeToSelectedDeviceSchema,
  sendScheduleNoticeToSelectedDeviceSchema,
} from "../validator/device.validator";

const deviceRouter = Router();

// protect all routes
deviceRouter.use(isLoggedIn);

// get all devices
deviceRouter.get("/", getAllDevices);

// change the mode of all devices
deviceRouter.patch(
  "/change-mode",
  validate(changeSelectedDeviceModeSchema),
  changeAllDevicesMode
); // COMPLETE

// schedule a notice for all devices
deviceRouter.patch(
  "/scheduled-notice",
  validate(sendScheduleNoticeToSelectedDeviceSchema),
  scheduleNoticeForAllDevices
); // COMPLETE

// send a notice to all devices
deviceRouter.patch(
  "/send-notice",
  validate(sendNoticeToSelectedDeviceSchema),
  sendNoticeToAllDevices
);

// get a specific device by ID
deviceRouter.get("/:deviceId", getDeviceById);

// restart a specific device
deviceRouter.patch("/:deviceId/restart", restartDeviceById);

// update a specific device firmware
deviceRouter.patch(
  "/:deviceId/update-firmware",
  authorize(["superadmin", "admin"]),
  updateDeviceFirmware
);

// Get all allowed access usrs for a device
deviceRouter.get("/:deviceId/allowed-users", getAllowedUsersForDevice);

// send the notice of a specific device
deviceRouter.patch(
  "/:deviceId/send-notice",
  validate(sendNoticeToDeviceSchema),
  sendNoticeInDevice
); // COMPLETE

// change the mode of a specific device
deviceRouter.patch(
  "/:deviceId/change-mode",
  validate(changeDeviceModeSchema),
  changeSingleDeviceMode
); // COMPLETE

// schedule a notice for a specific device
deviceRouter.patch(
  "/:deviceId/scheduled-notice",
  validate(scheduleNoticeForDeviceSchema),
  scheduleNoticeForDevice
); // COMPLETE

// get all scheduled notices for a specific device
deviceRouter.get("/:deviceId/scheduled-notices", getScheduledNoticeInDevice); // COMPLETE

// cancel a scheduled notice for a specific device
deviceRouter.delete(
  "/:deviceId/scheduled-notices/:scheduledId",
  cancelScheduledNoticeForDevice
);

// get all available fonts in a specific device
deviceRouter.get("/:deviceId/fonts", getAvailableFontsInDevice);

// change font and time format of a specific device
deviceRouter.post(
  "/:deviceId/change-font-time-format",
  changeFontAndTimeFormat
);

// give device access to users
deviceRouter.post(
  "/:deviceId/give-device-access",
  authorize(["admin", "superadmin"]),
  validate(giveDeviceAccessToUsersSchema),
  giveDeviceAccessToUsersInGroup
);

// revolk device access from user
deviceRouter.post(
  "/:deviceId/revoke-device-access/:userId",
  authorize(["admin", "superadmin"]),
  revokeDeviceAccessFromUser
);

export default deviceRouter;
