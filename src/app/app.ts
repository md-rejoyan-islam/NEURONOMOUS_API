import cors from "cors";
import express from "express";
import morgan from "morgan";
import router from "../routes/routes";
import secret from "./secret";

const app = express();

// Middleware to parse JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS configuration
// app.use(cors(corsOptions));
// for vps hosting
app.use(cors({ origin: secret.client_url, credentials: true }));

// morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(router);

export default app;
