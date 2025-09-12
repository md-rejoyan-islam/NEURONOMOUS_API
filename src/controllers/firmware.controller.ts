import { Request, Response } from "express";

import firmwareService from "../services/firmware.service";
import { asyncHandler } from "../utils/async-handler";
import { isValidMongoId } from "../utils/is-valid-mongo-id";
import { successResponse } from "../utils/response-handler";

// Get all firmware versions
const getAllFirmwares = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
    device_type,
    version,
    status,
  } = req.query;

  const { pagination, firmwares } = await firmwareService.getAllFirmwares({
    page: Number(page),
    limit: Number(limit),
    sortBy: String(sortBy),
    order: String(order) === "asc" ? 1 : -1,
    device_type: device_type ? String(device_type) : undefined,
    version: version ? String(version) : undefined,
    status: status ? String(status) : undefined,
  });

  successResponse(res, {
    message: "Fetched all firmware versions",
    statusCode: 200,
    payload: {
      pagination,
      data: firmwares,
    },
  });
});

// Get firmware version by ID
const getFirmwareById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const firmware = await firmwareService.getFirmwareById(id);

  successResponse(res, {
    message: `Fetched firmware version with ID ${id}`,
    statusCode: 200,
    payload: {
      data: firmware,
    },
  });
});

// Create a new firmware version
const createFirmware = asyncHandler(async (req: Request, res: Response) => {
  const { version, description, device_type } = req.body;

  if (!req.file || !("buffer" in req.file)) {
    throw new Error("Firmware file is missing or invalid");
  }

  const firmware = await firmwareService.createFirmware({
    version: version,
    description,
    device_type,
    file: req.file.buffer as Buffer,
  });

  successResponse(res, {
    message: "Firmware version created successfully",
    statusCode: 201,
    payload: {
      data: firmware,
    },
  });
});

// Delete a firmware version by ID
const deleteFirmwareById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await firmwareService.deleteFirmwareById(id);

  successResponse(res, {
    message: `Firmware version with ID ${id} deleted successfully`,
    statusCode: 200,
    payload: {},
  });
});

// Download firmware file
const downloadFirmwareFileById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidMongoId(id)) {
      throw new Error("Invalid firmware ID");
    }

    const firmware = await firmwareService.downloadFirmwareFileById(id);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${firmware.version}.bin`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.status(200).send(firmware.file);
  }
);

// updateFirmwareById
const updateFirmwareById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { version } = req.body;

  await firmwareService.updateFirmwareById(id, version);

  successResponse(res, {
    message: `Firmware version with ID ${id} updated successfully`,
    statusCode: 200,
    payload: {},
  });
});

// firmware status change
const updateFirmwareStatusById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const { status } = req.body;

    await firmwareService.updateFirmwareStatusById(id, status);

    successResponse(res, {
      message: `Firmware status with ID ${id} updated successfully`,
      statusCode: 200,
      payload: {},
    });
  }
);

const firmwareController = {
  getAllFirmwares,
  getFirmwareById,
  createFirmware,
  deleteFirmwareById,
  downloadFirmwareFileById,
  updateFirmwareById,
  updateFirmwareStatusById,
};

export default firmwareController;
