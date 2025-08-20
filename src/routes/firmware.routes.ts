import { Router } from "express";
import {
  createFirmware,
  deleteFirmwareById,
  downloadFirmwareFileById,
  getAllFirmwares,
  getFirmwareById,
} from "../controllers/firmware.controller";
import { authorize } from "../middlewares/authorized";
import validate from "../middlewares/validate";
import { isLoggedIn } from "../middlewares/verify";
import upload from "../utils/multer";
import { createFirmwareSchema } from "../validator/firmware.validator";

const firmwareRouter = Router();

// Middleware to check if user is logged
firmwareRouter.use(isLoggedIn);

// Get all firmware versions
firmwareRouter.get("/", authorize(["superadmin"]), getAllFirmwares);

// Get firmware version by ID
firmwareRouter.get("/:id", authorize(["superadmin"]), getFirmwareById);

// Create a new firmware version
firmwareRouter.post(
  "/",
  authorize(["superadmin"]),
  upload.single("file"),
  validate(createFirmwareSchema),
  createFirmware
);

// Delete a firmware version by ID
firmwareRouter.delete("/:id", authorize(["superadmin"]), deleteFirmwareById);

// Download firmware file by ID
firmwareRouter.get(
  "/:id/download",
  authorize(["superadmin"]),
  downloadFirmwareFileById
);

export default firmwareRouter;
