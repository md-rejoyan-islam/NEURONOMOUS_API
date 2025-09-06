import http from "http";
import app from "./app/app";
import secret from "./app/secret";
import { connectDB } from "./config/db";
import { setupMqttClient } from "./config/mqtt";
import { initSocketServer } from "./socket";
import { logger } from "./utils/logger";

const PORT = secret.port;
const server = http.createServer(app);

// Initialize MQTT client
setupMqttClient();

// Initialize Socket.IO on the same HTTP server
initSocketServer(server);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info({
        message: `Server is running on http://localhost:${PORT}`,
        status: 200,
      });
    });
  } catch (error) {
    logger.error({
      message: "Failed to connect to the database or start the server:",
      status: 500,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : "No stack trace available",
    });

    process.exit(1);
  }
};
startServer();
