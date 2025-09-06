import mongoose from "mongoose";
import secret from "../app/secret";
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(secret.mongo_uri);
    logger.info({
      message: `MongoDB connected at ${connection.connection.host}:${connection.connection.port}`,
      status: 200,
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
