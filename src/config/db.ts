import mongoose from "mongoose";
import secret from "../app/secret";
import { errorLogger, logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(secret.mongo_uri);
    logger.info(
      `MongoDB connected at ${connection.connection.host}:${connection.connection.port}`
    );
  } catch (error) {
    errorLogger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
