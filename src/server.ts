import http from "http";
import app from "./app/app";
import secret from "./app/secret";
import { connectDB } from "./config/db";
import { setupMqttClient } from "./config/mqtt";
import { Schedule } from "./models/schedule.model";
import startAgenda, { agenda } from "./services/agenda.service";
import { initSocketServer } from "./socket";
import { logger } from "./utils/logger";

const PORT = secret.port;
const server = http.createServer(app);
const server2 = http.createServer();

// Initialize MQTT client
setupMqttClient();

// Initialize Socket.IO on the same HTTP server
initSocketServer(server);

// Schedule all pending jobs on server start
const schedulePendingJobs = async () => {
  const pendingSchedules = await Schedule.find({ is_executed: false });

  for (const sch of pendingSchedules) {
    // Schedule start job
    await agenda.schedule(new Date(sch.start_time), "start-schedule", {
      scheduleId: sch._id,
    });

    // Schedule end job
    await agenda.schedule(new Date(sch.end_time), "end-schedule", {
      scheduleId: sch._id,
    });

    console.log(`📌 Jobs scheduled for ${sch._id}`);
  }
};
schedulePendingJobs();

const startServer = async () => {
  try {
    await connectDB();
    await startAgenda();
    await schedulePendingJobs();
    server.listen(PORT, () => {
      logger.info({
        message: `Server is running on http://localhost:${PORT}`,
        status: 200,
      });
    });
    server2.listen(5051, () => {
      logger.info({
        message: `Attendance WebSocket Server is running on ws://localhost:8080/ws/attendance`,
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
