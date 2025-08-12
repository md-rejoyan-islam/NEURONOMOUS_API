import cors from "cors";
import express from "express";
import morgan from "morgan";
import corsOptions from "../config/cors";
import { setupMqttClient } from "../config/mqtt";
import router from "../routes/routes";

const app = express();

// Middleware to parse JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS configuration
app.use(cors(corsOptions));

// morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// else {
//   app.use(morgan("combined"));
// }

app.use(router);

// Initialize MQTT client
setupMqttClient();

export default app;
