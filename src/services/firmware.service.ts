import createError from "http-errors";
import { FirmwareModel } from "../models/firmware.model";

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
    type: firmware.type,
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
  type: "single" | "double";
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
