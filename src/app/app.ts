import cors from "cors";
import express, { Request, Response } from "express";
import morgan, { StreamOptions } from "morgan";
import path from "path";
import router from "../routes/routes";
import { logger } from "../utils/logger";
import secret from "./secret";

const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static files
app.use("/public", express.static(path.join(process.cwd(), "/src/public/")));

// CORS configuration
// app.use(cors(corsOptions));
// for vps hosting
app.use(cors({ origin: secret.client_url, credentials: true }));

const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

// morgan
if (process.env.NODE_ENV === "development") {
  app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
      stream,
    })
  );
}

// rate limiter
// app.use(limiter);

// Handle favicon requests
app.get("/favicon.ico", (_req: Request, res: Response) =>
  res.status(204).end()
);

app.use(router);

export default app;
