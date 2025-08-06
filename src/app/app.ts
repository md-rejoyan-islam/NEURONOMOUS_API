import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import corsOptions from "../config/cors";
import { setupMqttClient } from "../config/mqtt";
import router from "../routes/routes";

dotenv.config();

const app = express();

// Middleware to parse JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS configuration
app.use(cors(corsOptions));

app.use(router);

// Initialize MQTT client
setupMqttClient();

export default app;
