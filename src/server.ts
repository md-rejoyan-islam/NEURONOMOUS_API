import http from "http";
import app from "./app/app";
import secret from "./app/secret";
import { connectDB } from "./config/db";
import { initSocketServer } from "./socket";
import { logger } from "./utils/logger";

const PORT = secret.port;
const server = http.createServer(app);

// Initialize Socket.IO on the same HTTP server
initSocketServer(server);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(
      "Failed to connect to the database or start the server:",
      error
    );
    process.exit(1);
  }
};
startServer();
