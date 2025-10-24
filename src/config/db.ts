import mongoose from "mongoose";
import secret from "../app/secret";
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(secret.mongo_uri);
    logger.info(
      `MongoDB connected at ${connection.connection.host}:${connection.connection.port}`,
      {
        source: "Database",
      }
    );
  } catch (error) {
    logger.error(error);
    logger.critical("Database connection failed", {
      error,
    });

    process.exit(1);
  }
};
