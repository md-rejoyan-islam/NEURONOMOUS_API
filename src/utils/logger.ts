import winston, { createLogger, format, Logger, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import "winston-mongodb";
import secret from "../app/secret";
const { printf } = format;

import LokiTransport from "winston-loki";

const logDirectory = "src/logs";

const syslogColors = {
  info: "bold magenta inverse",
  error: "bold red inverse",
};

const myFormat = printf(({ message, timestamp, level, stack }) => {
  const date = new Date(timestamp as string);
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${date.toDateString()} ${hour}:${minutes}:${seconds}  [${level}] : ${message} ${stack ? `\n ${stack}` : ""}`;
});

const mongoDbObjectFormat = format((info) => {
  info.label = info.level;
  info.status = info.status || null;
  info.stack = info.stack || null;
  return info;
});

const consoleFormat = format.combine(
  format.colorize({ all: true, colors: syslogColors }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  myFormat
);

const jsonFormat = format.combine(format.timestamp(), format.json());

// 1. Define custom logging levels
const customLevels = {
  levels: {
    critical: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    debug: 5,
    trace: 6,
  },
  colors: {
    critical: "red bold",
    error: "red",
    warn: "yellow",
    http: "magenta",
    info: "green",
    debug: "blue",
    trace: "grey",
  },
};

interface CustomLogger extends Logger {
  login_failed: winston.LeveledLogMethod;
  password_changed: winston.LeveledLogMethod;
  http: winston.LeveledLogMethod;
  fatal: winston.LeveledLogMethod;
  critical: winston.LeveledLogMethod;
}

const lokiTransport = new LokiTransport({
  host: "http://localhost:3100", // Your Loki endpoint
  labels: { app: "neuronomous-iot", env: "dev" },
  json: true,
  format: winston.format.json(),
  // Optional: batch logs to reduce network calls
  batching: true,
  interval: 5,
});

export const logger = createLogger({
  levels: customLevels.levels,
  level: "trace",
  // levels: config.npm.levels,
  // level: "http",
  transports: [
    new transports.Console({
      format: consoleFormat,
    }),
    new DailyRotateFile({
      level: "info",
      filename: `${logDirectory}/combined-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: jsonFormat,
    }),
    lokiTransport,

    new transports.MongoDB({
      level: "info",
      db: secret.mongo_uri,
      collection: "logs",
      capped: true,
      cappedSize: 10000000, // 10MB,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        mongoDbObjectFormat()
      ),
    }),
  ],
}) as CustomLogger;
