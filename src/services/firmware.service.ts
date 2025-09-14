import createError from "http-errors";
import { mqttClient } from "../config/mqtt";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { FirmwareModel } from "../models/firmware.model";
import { logger } from "../utils/logger";

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
const getAllFirmwares = async ({
  page,
  limit,
  sortBy,
  order,
  device_type,
  version,
  status,
}: {
  page: number;
  limit: number;
  sortBy: string;
  order: 1 | -1;
  device_type?: string;
  version?: string;
  status?: string;
}) => {
  const query: {
    device_type?: string;
    version?: string;
    status?: string;
  } = {};

  if (device_type) {
    query.device_type = device_type;
  }
  if (version) {
    query.version = version;
  }
  if (status) {
    query.status = status;
  }

  const firmwares = await FirmwareModel.find(query)
    .sort({ [sortBy]: order })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalFirmwares = await FirmwareModel.countDocuments(query);

  const pagination = {
    total: totalFirmwares,
    page: page,
    limit: limit,
    totalPages: Math.ceil(totalFirmwares / limit),
  };
  return {
    pagination,
    firmwares: firmwares.map((firmware) => ({
      _id: firmware._id,
      version: firmware.version,
      size: formatFileSize(firmware.file.length), // Convert bytes to KB
      status: firmware.status,
      device_type: firmware.device_type,
      description: firmware.description,
      createdAt: firmware.createdAt,
      updatedAt: firmware.updatedAt,
    })),
  };
};

// get firmware version by ID
const getFirmwareById = async (id: string) => {
  const firmware = await FirmwareModel.findById(id).lean();
  if (!firmware) {
    throw new Error(`Firmware with ID ${id} not found`);
  }
  return firmware;
};

// create a new firmware version
const createFirmware = async (firmwareData: {
  version: number;
  description: string;
  device_type: "clock" | "attendance";
  file: File | Buffer;
}) => {
  const existingFirmware = await FirmwareModel.findOne({
    device_type: firmwareData.device_type,
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
const deleteFirmwareById = async (id: string) => {
  const firmware = await FirmwareModel.findByIdAndDelete(id).exec();
  if (!firmware) {
    throw new Error(`Firmware with ID ${id} not found`);
  }
};

// download firmware file by ID
const downloadFirmwareFileById = async (id: string) => {
  const firmware = await FirmwareModel.findById(id);
  if (!firmware) {
    throw new Error(`Firmware with ID ${id} not found`);
  }

  return firmware;
};

// update firmware version by ID
const updateFirmwareById = async (id: string, version: string) => {
  const device = await ClockDeviceModel.findById(id).lean();
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
    const topic = `device/${device.mac_id}/ota/control`;

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
    logger.error(`Failed to update firmaware`, error); // Log the error
    // throw createError(500, `MQTT publish to ${topic} failed .`);
  }
};

// update firmware status by ID
const updateFirmwareStatusById = async (
  id: string,
  status: "active" | "inactive"
) => {
  const firmware = await FirmwareModel.findById(id);
  if (!firmware) {
    throw createError(404, `Firmware with ID ${id} not found`);
  }

  firmware.status = status;
  await firmware.save();
};

const firmwareService = {
  getAllFirmwares,
  getFirmwareById,
  createFirmware,
  deleteFirmwareById,
  downloadFirmwareFileById,
  updateFirmwareById,
  updateFirmwareStatusById,
};

export default firmwareService;
