import createError from "http-errors";
import { mqttClient } from "../config/mqtt";
import { DeviceModel } from "../models/device.model";
import { FirmwareModel } from "../models/firmware.model";
import { errorLogger, logger } from "../utils/logger";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// get all firmware versions
export const getAllFirmwaresService = async () => {
  const firmwares = await FirmwareModel.find();

  return firmwares.map((firmware) => ({
    _id: firmware._id,
    version: firmware.version,
    size: formatFileSize(firmware.file.length), // Convert bytes to KB
    description: firmware.description,
    createdAt: firmware.createdAt,
    updatedAt: firmware.updatedAt,
  }));
};

// get firmware version by ID
export const getFirmwareByIdService = async (id: string) => {
  const firmware = await FirmwareModel.findById(id).lean();
  if (!firmware) {
    throw new Error(`Firmware with ID ${id} not found`);
  }
  return firmware;
};

// create a new firmware version
export const createFirmwareService = async (firmwareData: {
  version: number;
  description: string;
  file: File | Buffer;
}) => {
  const existingFirmware = await FirmwareModel.findOne({
    version: firmwareData.version,
  });

  if (existingFirmware) {
    throw createError(
      400,
      `Firmware version ${firmwareData.version} already exists`
    );
  }

  const firmware = new FirmwareModel(firmwareData);
  await firmware.save();
  return firmware.toObject();
};

// delete a firmware version by ID
export const deleteFirmwareByIdService = async (id: string) => {
  const firmware = await FirmwareModel.findByIdAndDelete(id).exec();
  if (!firmware) {
    throw new Error(`Firmware with ID ${id} not found`);
  }
};

// download firmware file by ID
export const downloadFirmwareFileByIdService = async (id: string) => {
  const firmware = await FirmwareModel.findById(id);
  if (!firmware) {
    throw new Error(`Firmware with ID ${id} not found`);
  }

  return firmware;
};

// update firmware version by ID
export const updateFirmwareByIdService = async (
  id: string,
  version: string
) => {
  const device = await DeviceModel.findById(id).lean();
  if (!device) {
    throw createError(404, `Device with ID ${id} not found`);
  }

  const firmware = await FirmwareModel.findOne({
    version: version,
  }).lean();

  if (!firmware) {
    throw createError(404, `Firmware version ${version} not found`);
  }

  try {
    const topic = `device/${id}/ota/control`;

    await new Promise<void>((resolve, reject) => {
      mqttClient.publish(
        topic,
        firmware._id.toString(),
        { qos: 1, retain: false },
        (err) => {
          if (err) {
            reject(err);
          }

          resolve();
        }
      );
      logger.info(`Firmware version sent`); // Log successful publish
    });
  } catch (error) {
    errorLogger.error(`Failed to update firmaware`, error); // Log the error
    // throw createError(500, `MQTT publish to ${topic} failed .`);
  }
};
