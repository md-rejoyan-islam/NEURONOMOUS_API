import { Router } from "express";
import firmwareController from "../controllers/firmware.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import upload from "../utils/multer";
import {
  createFirmwareSchema,
  updateDeviceFirmwareSchema,
  updateFirmwareStatusSchema,
} from "../validator/firmware.validator";

const firmwareRouter = Router();

// Get all firmware versions
firmwareRouter.get(
  "/",
  isLoggedIn,
  authorize(["superadmin"]),
  firmwareController.getAllFirmwares
);

// Create a new firmware version
firmwareRouter.post(
  "/",
  isLoggedIn,
  authorize(["superadmin"]),
  upload.single("file"),
  validate(createFirmwareSchema),
  firmwareController.createFirmware
);

// Get firmware version by ID
firmwareRouter.get(
  "/:id",
  isLoggedIn,
  authorize(["superadmin"]),
  firmwareController.getFirmwareById
);

// update firmware version by ID
firmwareRouter.patch(
  "/:id",
  authorize(["superadmin", "admin"]),
  validate(updateDeviceFirmwareSchema),
  firmwareController.updateFirmwareById
);

// Delete a firmware version by ID
firmwareRouter.delete(
  "/:id",
  isLoggedIn,
  authorize(["superadmin"]),
  firmwareController.deleteFirmwareById
);

// Download firmware file by ID
firmwareRouter.get(
  "/:id/download",
  // authorize(["superadmin"]),
  firmwareController.downloadFirmwareFileById
);

// firmware status change route
firmwareRouter.patch(
  "/:id/status",
  isLoggedIn,
  authorize(["superadmin"]),
  validate(updateFirmwareStatusSchema),
  firmwareController.updateFirmwareStatusById
);

export default firmwareRouter;
