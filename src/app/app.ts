import cors from "cors";
import express from "express";
import morgan from "morgan";
import limiter from "../config/rate-limiter";
import router from "../routes/routes";
import secret from "./secret";

const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
// app.use(cors(corsOptions));
// for vps hosting
app.use(cors({ origin: secret.client_url, credentials: true }));

// morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// rate limiter
app.use(limiter);

app.use(router);

export default app;
