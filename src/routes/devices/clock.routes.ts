import { Router } from "express";
import clockController from "../../controllers/devices/clock.controller";
import { authorize } from "../../middlewares/authorized";
import validate from "../../middlewares/validate";
import { isLoggedIn } from "../../middlewares/verify";

import clockValidator from "../../validator/devices/clock.validator";

const clockRouter = Router();

// protect all routes
clockRouter.use(isLoggedIn);

// get all devices
clockRouter.get(
  "/",
  validate(clockValidator.getAllDevices),
  clockController.getAllDevices
);

// change the mode of all devices ( update route /bulk+)
clockRouter.patch(
  "/change-mode",
  validate(clockValidator.changeSelectedDeviceMode),
  clockController.changeAllDevicesMode
); // COMPLETE

// schedule a notice for all devices ( update route /bulk+)
clockRouter.patch(
  "/scheduled-notice",
  validate(clockValidator.sendScheduleNoticeToSelectedDevice),
  clockController.scheduleNoticeForAllDevices
); // COMPLETE

// send a notice to all devices ( update route /bulk+)
clockRouter.patch(
  "/send-notice",
  validate(clockValidator.sendNoticeToSelectedDevice),
  clockController.sendNoticeToAllDevices
);
// add clock device to group
clockRouter.post(
  "/group/:groupId",
  authorize(["admin", "superadmin"]),
  validate(clockValidator.addClockToGroup),
  clockController.addClockToGroup
);

// get a specific device by ID
clockRouter.get("/:deviceId", clockController.getDeviceById);

// restart a specific device
clockRouter.patch("/:deviceId/restart", clockController.restartDeviceById);

// update a specific device firmware
clockRouter.patch(
  "/:deviceId/update-firmware",
  authorize(["superadmin", "admin"]),
  clockController.updateDeviceFirmware
);

// Get all allowed access usrs for a device
clockRouter.get(
  "/:deviceId/allowed-users",
  clockController.getAllowedUsersForDevice
);

// send the notice of a specific device
clockRouter.patch(
  "/:deviceId/send-notice",
  validate(clockValidator.sendNoticeToDevice),
  clockController.sendNoticeInDevice
); // COMPLETE

// change the mode of a specific device
clockRouter.patch(
  "/:deviceId/change-mode",
  validate(clockValidator.changeDeviceMode),
  clockController.changeSingleDeviceMode
); // COMPLETE

clockRouter.patch(
  "/:deviceId/change-scene",
  clockController.changeSingleDeviceScene
); // COMPLETE

// schedule a notice for a specific device
clockRouter.patch(
  "/:deviceId/scheduled-notice",
  validate(clockValidator.scheduleNoticeForDevice),
  clockController.scheduleNoticeForDevice
); // COMPLETE

// get all scheduled notices for a specific device
clockRouter.get(
  "/:deviceId/scheduled-notices",
  clockController.getScheduledNoticeInDevice
); // COMPLETE

// cancel a scheduled notice for a specific device
clockRouter.delete(
  "/:deviceId/scheduled-notices/:scheduledId",
  clockController.cancelScheduledNoticeForDevice
);

// get all available fonts in a specific device
clockRouter.get("/:deviceId/fonts", clockController.getAvailableFontsInDevice);

// change font and time format of a specific device
clockRouter.post(
  "/:deviceId/change-font-time-format",
  clockController.changeFontAndTimeFormat
);

// give device access to users
clockRouter.post(
  "/:deviceId/give-device-access",
  authorize(["admin", "superadmin"]),
  validate(clockValidator.giveDeviceAccessToUsers),
  clockController.giveDeviceAccessToUsersInGroup
);

// revolk device access from user
clockRouter.post(
  "/:deviceId/revoke-device-access/:userId",
  authorize(["admin", "superadmin"]),
  clockController.revokeDeviceAccessFromUser
);

export default clockRouter;
