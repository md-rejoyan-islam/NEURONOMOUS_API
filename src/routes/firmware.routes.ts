import { Router } from "express";
import {
  createFirmware,
  deleteFirmwareById,
  downloadFirmwareFileById,
  getAllFirmwares,
  getFirmwareById,
  updateFirmwareById,
} from "../controllers/firmware.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import upload from "../utils/multer";
import {
  createFirmwareSchema,
  updateDeviceFirmwareSchema,
} from "../validator/firmware.validator";

const firmwareRouter = Router();

// Middleware to check if user is logged
// firmwareRouter.use(isLoggedIn);

// Get all firmware versions
firmwareRouter.get("/", isLoggedIn, authorize(["superadmin"]), getAllFirmwares);

// Get firmware version by ID
firmwareRouter.get(
  "/:id",
  isLoggedIn,
  authorize(["superadmin"]),
  getFirmwareById
);

// Create a new firmware version
firmwareRouter.post(
  "/",
  isLoggedIn,
  authorize(["superadmin"]),
  upload.single("file"),
  validate(createFirmwareSchema),
  createFirmware
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

// update firmware version by ID
firmwareRouter.patch(
  "/:id",
  authorize(["superadmin", "admin"]),
  validate(updateDeviceFirmwareSchema),
  updateFirmwareById
);

export default firmwareRouter;
