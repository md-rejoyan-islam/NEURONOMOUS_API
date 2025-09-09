import { Request, Response } from "express";
import {
  createFirmwareService,
  deleteFirmwareByIdService,
  downloadFirmwareFileByIdService,
  getAllFirmwaresService,
  getFirmwareByIdService,
  updateFirmwareByIdService,
  updateFirmwareStatusByIdService,
} from "../services/firmware.service";
import { asyncHandler } from "../utils/async-handler";
import { isValidMongoId } from "../utils/is-valid-mongo-id";
import { successResponse } from "../utils/response-handler";

// Get all firmware versions
export const getAllFirmwares = asyncHandler(
  async (req: Request, res: Response) => {
    const firmwares = await getAllFirmwaresService();

    successResponse(res, {
      message: "Fetched all firmware versions",
      statusCode: 200,
      payload: {
        data: firmwares,
      },
    });
  }
);

// Get firmware version by ID
export const getFirmwareById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const firmware = await getFirmwareByIdService(id);

    successResponse(res, {
      message: `Fetched firmware version with ID ${id}`,
      statusCode: 200,
      payload: {
        data: firmware,
      },
    });
  }
);

// Create a new firmware version
export const createFirmware = asyncHandler(
  async (req: Request, res: Response) => {
    const { version, description, device_type } = req.body;

    if (!req.file || !("buffer" in req.file)) {
      throw new Error("Firmware file is missing or invalid");
    }

    const firmware = await createFirmwareService({
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
  }
);

// Delete a firmware version by ID
export const deleteFirmwareById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    await deleteFirmwareByIdService(id);

    successResponse(res, {
      message: `Firmware version with ID ${id} deleted successfully`,
      statusCode: 200,
      payload: {},
    });
  }
);

// Download firmware file
export const downloadFirmwareFileById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!isValidMongoId(id)) {
      throw new Error("Invalid firmware ID");
    }

    const firmware = await downloadFirmwareFileByIdService(id);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${firmware.version}.bin`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.status(200).send(firmware.file);
  }
);

// updateFirmwareById
export const updateFirmwareById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const { version } = req.body;

    await updateFirmwareByIdService(id, version);

    successResponse(res, {
      message: `Firmware version with ID ${id} updated successfully`,
      statusCode: 200,
      payload: {},
    });
  }
);

// firmware status change
export const updateFirmwareStatusById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const { status } = req.body;

    await updateFirmwareStatusByIdService(id, status);

    successResponse(res, {
      message: `Firmware status with ID ${id} updated successfully`,
      statusCode: 200,
      payload: {},
    });
  }
);
