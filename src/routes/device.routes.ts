import { Router } from "express";
import {
  changeDeviceMode,
  getAllDevices,
  getDeviceById,
  sendNoticeToDevice,
} from "../controllers/device.controller";

const devicesRouter = Router();

devicesRouter.get("/", getAllDevices);
devicesRouter.get("/:deviceId", getDeviceById);
devicesRouter.post("/:deviceId/notice", sendNoticeToDevice);
devicesRouter.post("/:deviceId/mode", changeDeviceMode);

export default devicesRouter;
