import { Request, Response } from "express";
import { IRequestWithUser } from "../app/types";
import summaryService from "../services/summary.service";
import { asyncHandler } from "../utils/async-handler";
import { successResponse } from "../utils/response-handler";

const dashboardPageSummary = asyncHandler(
  async (req: IRequestWithUser, res: Response) => {
    const { _id } = req.user!;

    const summary = await summaryService.dashboardPageSummary({
      _id,
    });

    successResponse(res, {
      message: "Dashboard page summary fetched successfully",
      payload: {
        data: summary,
      },
    });
  }
);

const downloadClockDevicesSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const csv = await summaryService.downloadClockDevicesSummary();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="clock_devices_summary.csv"'
    );
    res.status(200).send(csv);
  }
);

const downloadAttendanceDevicesSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const csv = await summaryService.downloadAttendanceDevicesSummary();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="attendance_devices_summary.csv"'
    );
    res.status(200).send(csv);
  }
);

const downloadStudentsSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const csv = await summaryService.downloadStudentsSummary();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="students_summary.csv"'
    );
    res.status(200).send(csv);
  }
);

const summaryController = {
  dashboardPageSummary,
  downloadClockDevicesSummary,
  downloadAttendanceDevicesSummary,
  downloadStudentsSummary,
};

export default summaryController;
