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
} from "../controllers/clock-device.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  changeDeviceModeSchema,
  changeSelectedDeviceModeSchema,
  getAllDevicesSchema,
  giveDeviceAccessToUsersSchema,
  scheduleNoticeForDeviceSchema,
  sendNoticeToDeviceSchema,
  sendNoticeToSelectedDeviceSchema,
  sendScheduleNoticeToSelectedDeviceSchema,
} from "../validator/device.validator";

const clockRouter = Router();

// protect all routes
clockRouter.use(isLoggedIn);

// get all devices
clockRouter.get("/", validate(getAllDevicesSchema), getAllDevices);

// change the mode of all devices
clockRouter.patch(
  "/change-mode",
  validate(changeSelectedDeviceModeSchema),
  changeAllDevicesMode
); // COMPLETE

// schedule a notice for all devices
clockRouter.patch(
  "/scheduled-notice",
  validate(sendScheduleNoticeToSelectedDeviceSchema),
  scheduleNoticeForAllDevices
); // COMPLETE

// send a notice to all devices
clockRouter.patch(
  "/send-notice",
  validate(sendNoticeToSelectedDeviceSchema),
  sendNoticeToAllDevices
);

// get a specific device by ID
clockRouter.get("/:deviceId", getDeviceById);

// restart a specific device
clockRouter.patch("/:deviceId/restart", restartDeviceById);

// update a specific device firmware
clockRouter.patch(
  "/:deviceId/update-firmware",
  authorize(["superadmin", "admin"]),
  updateDeviceFirmware
);

// Get all allowed access usrs for a device
clockRouter.get("/:deviceId/allowed-users", getAllowedUsersForDevice);

// send the notice of a specific device
clockRouter.patch(
  "/:deviceId/send-notice",
  validate(sendNoticeToDeviceSchema),
  sendNoticeInDevice
); // COMPLETE

// change the mode of a specific device
clockRouter.patch(
  "/:deviceId/change-mode",
  validate(changeDeviceModeSchema),
  changeSingleDeviceMode
); // COMPLETE

// schedule a notice for a specific device
clockRouter.patch(
  "/:deviceId/scheduled-notice",
  validate(scheduleNoticeForDeviceSchema),
  scheduleNoticeForDevice
); // COMPLETE

// get all scheduled notices for a specific device
clockRouter.get("/:deviceId/scheduled-notices", getScheduledNoticeInDevice); // COMPLETE

// cancel a scheduled notice for a specific device
clockRouter.delete(
  "/:deviceId/scheduled-notices/:scheduledId",
  cancelScheduledNoticeForDevice
);

// get all available fonts in a specific device
clockRouter.get("/:deviceId/fonts", getAvailableFontsInDevice);

// change font and time format of a specific device
clockRouter.post("/:deviceId/change-font-time-format", changeFontAndTimeFormat);

// give device access to users
clockRouter.post(
  "/:deviceId/give-device-access",
  authorize(["admin", "superadmin"]),
  validate(giveDeviceAccessToUsersSchema),
  giveDeviceAccessToUsersInGroup
);

// revolk device access from user
clockRouter.post(
  "/:deviceId/revoke-device-access/:userId",
  authorize(["admin", "superadmin"]),
  revokeDeviceAccessFromUser
);

export default clockRouter;
