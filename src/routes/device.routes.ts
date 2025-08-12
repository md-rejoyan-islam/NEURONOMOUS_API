import { Router } from "express";

import {
  cancelScheduledNoticeForDevice,
  changeAllDevicesMode,
  changeFontAndTimeFormat,
  changeSingleDeviceMode,
  getAllDevices,
  getAvailableFontsInDevice,
  getDeviceById,
  getScheduledNoticeInDevice,
  scheduleNoticeForAllDevices,
  scheduleNoticeForDevice,
  sendNoticeInDevice,
  sendNoticeToAllDevices,
} from "../controllers/device.controller";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import {
  changeDeviceModeSchema,
  scheduleNoticeForDeviceSchema,
  sendNoticeToDeviceSchema,
} from "../validator/device.validator";

const deviceRouter = Router();

// protect all routes
deviceRouter.use(isLoggedIn);

// get all devices
deviceRouter.get("/", getAllDevices);

// change the mode of all devices
deviceRouter.post("/change-mode", changeAllDevicesMode);

// schedule a notice for all devices
deviceRouter.post("/scheduled-notice", scheduleNoticeForAllDevices);

// send a notice to all devices
deviceRouter.post("/:deviceId/send-notice", sendNoticeToAllDevices);

// get a specific device by ID
deviceRouter.get("/:deviceId", getDeviceById);

// send the notice of a specific device
deviceRouter.patch(
  "/:deviceId/send-notice",
  validate(sendNoticeToDeviceSchema),
  sendNoticeInDevice
);

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
);

// get all scheduled notices for a specific device
deviceRouter.get("/:deviceId/scheduled-notices", getScheduledNoticeInDevice);

// cancel a scheduled notice for a specific device
deviceRouter.delete(
  "/:deviceId/scheduled-notices/:noticeId",
  cancelScheduledNoticeForDevice
);

// get all available fonts in a specific device
deviceRouter.get("/:deviceId/fonts", getAvailableFontsInDevice);

// change font and time format of a specific device
deviceRouter.post(
  "/:deviceId/change-font-time-format",
  changeFontAndTimeFormat
);

export default deviceRouter;
