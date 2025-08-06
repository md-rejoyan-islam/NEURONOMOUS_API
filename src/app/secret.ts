import dotenv from "dotenv";
dotenv.config();

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

const secret = {
  mqtt_broker_url,
  mqtt_port,
  mqtt_user,
  mqtt_pass,
  node_env,
  mongo_uri,
  port,
  max_requests,
  max_requests_window,
  clinetWhiteList,
};

export default secret;
