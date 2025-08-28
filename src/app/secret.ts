import dotenv from "dotenv";
dotenv.config({
  quiet: true,
  override: true,
  path: ".env",
  debug: process.env.NODE_ENV === "development",
});

const mqtt_broker_url: string = process.env.MQTT_BROKER_URL!;
const mqtt_port: number = +process.env.MQTT_PORT!;
const mqtt_user: string = process.env.MQTT_USER!;
const mqtt_pass: string = process.env.MQTT_PASS!;
const node_env: string = process.env.NODE_ENV!;
const mongo_uri: string = process.env.MONGO_URI!;
const port: number = +process.env.SERVER_PORT!;
const max_requests: number = +process.env.MAX_REQUESTS!;
const max_requests_window: number = +process.env.MAX_REQUESTS_WINDOW!;
const clinetWhiteList: string[] =
  process.env.CLIENT_WHITELIST?.split(",") || [];
const accessTokenSecret: string = process.env.JWT_ACCESS_TOKEN_SECRET!;
const refreshTokenSecret: string = process.env.JWT_REFRESH_TOKEN_SECRET!;
const accessTokenExpiresIn: number = parseInt(
  process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "3600",
  10
);
const refreshTokenExpiresIn: number = parseInt(
  process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "86400",
  10
);
const passwordResetCodeExpiresIn: number =
  Date.now() + +process.env.PASSWORD_RESET_CODE_EXPIRES_IN! * 60 * 1000;

const emailHost: string = process.env.EMAIL_HOST!;
const emailPort: number = +process.env.EMAIL_PORT!;
const emailUsername: string = process.env.EMAIL_USERNAME!;
const emailPassword: string = process.env.EMAIL_PASSWORD!;

const client_url: string = process.env.CLIENT_URL!;
const FIRMWARE_BASE_URL: string = process.env.FIRMWARE_BASE_URL!;

const secret = {
  mqtt_broker_url,
  mqtt_port,
  mqtt_user,
  mqtt_pass,
  node_env,
  mongo_uri,
  client_url,
  port,
  max_requests,
  max_requests_window,
  clinetWhiteList,
  passwordResetCodeExpiresIn,
  FIRMWARE_BASE_URL,
  jwt: {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
  },
  nodeMailer: {
    emailHost,
    emailPort,
    emailUsername,
    emailPassword,
  },
};

export default secret;
