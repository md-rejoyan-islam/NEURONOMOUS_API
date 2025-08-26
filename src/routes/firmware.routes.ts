import { Router } from "express";
import {
  createFirmware,
  deleteFirmwareById,
  downloadFirmwareFileById,
  getAllFirmwares,
  getFirmwareById,
  updateFirmwareById,
  updateFirmwareStatusById,
} from "../controllers/firmware.controller";
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

// Middleware to check if user is logged
// firmwareRouter.use(isLoggedIn);

// Get all firmware versions
firmwareRouter.get("/", isLoggedIn, authorize(["superadmin"]), getAllFirmwares);

// Create a new firmware version
firmwareRouter.post(
  "/",
  isLoggedIn,
  authorize(["superadmin"]),
  upload.single("file"),
  validate(createFirmwareSchema),
  createFirmware
);

// Get firmware version by ID
firmwareRouter.get(
  "/:id",
  isLoggedIn,
  authorize(["superadmin"]),
  getFirmwareById
);

// update firmware version by ID
firmwareRouter.patch(
  "/:id",
  authorize(["superadmin", "admin"]),
  validate(updateDeviceFirmwareSchema),
  updateFirmwareById
);

// Delete a firmware version by ID
firmwareRouter.delete(
  "/:id",
  isLoggedIn,
  authorize(["superadmin"]),
  deleteFirmwareById
);

// Download firmware file by ID
firmwareRouter.get(
  "/:id/download",
  // authorize(["superadmin"]),
  downloadFirmwareFileById
);

// firmware status change route
firmwareRouter.patch(
  "/:id/status",
  isLoggedIn,
  authorize(["superadmin"]),
  validate(updateFirmwareStatusSchema),
  updateFirmwareStatusById
);

export default firmwareRouter;
