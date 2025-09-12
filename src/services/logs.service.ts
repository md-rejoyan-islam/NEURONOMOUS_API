import { Log } from "../models/logs.model";

const getAllLog = async (query: {
  level?: string;
  search?: { $regex: string; $options: string };
  timestamp?: { $gte?: Date; $lte?: Date };
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}) => {
  const logs = await Log.find({
    ...(query.level ? { level: query.level } : {}),
    ...(query.search
      ? { $or: [{ message: query.search }, { "metadata.stack": query.search }] }
      : {}),
    ...(query.timestamp ? { timestamp: query.timestamp } : {}),
  })
    .sort({ [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean();

  const total = await Log.countDocuments({
    ...(query.level ? { level: query.level } : {}),
    ...(query.search
      ? { $or: [{ message: query.search }, { "metadata.stack": query.search }] }
      : {}),
    ...(query.timestamp ? { timestamp: query.timestamp } : {}),
  });

  const pagination = {
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit),
  };

  return { logs, pagination };
};

const logService = {
  getAllLog,
};

export default logService;
