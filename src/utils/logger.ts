import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import "winston-mongodb";
import secret from "../app/secret";
const { printf } = format;

const logDirectory = "src/logs";

const syslogColors = {
  info: "bold magenta inverse",
  error: "bold red inverse",
};

const myFormat = printf(({ message, timestamp, level }) => {
  const date = new Date(timestamp as string);
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${date.toDateString()} ${hour}:${minutes}:${seconds}  [${level}] : ${message}`;
});

const consoleFormat = format.combine(
  format.colorize({ all: true, colors: syslogColors }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  myFormat
);

const jsonFormat = format.combine(format.timestamp(), format.json());

export const logger = createLogger({
  level: "info",
  format: jsonFormat,
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
    }),
    new transports.MongoDB({
      level: "info",
      db: secret.mongo_uri,
      collection: "logs",
      format: jsonFormat,
      capped: true,
      cappedSize: 10000000, // 10MB
    }),
  ],
});
