import mqtt, { MqttClient } from "mqtt";
import secret from "../app/secret";
import { handleMqttMessage } from "../services/mqtt.service";
import { logger } from "../utils/logger";

const mqttOptions = {
  port: secret.mqtt_port,
  username: secret.mqtt_user,
  password: secret.mqtt_pass,
  protocol: "mqtts" as const,
  rejectUnauthorized: false,
};

export const CLOCK_HEADER_TOPIC = "devices/clock/";
export const STATUS_TOPIC = CLOCK_HEADER_TOPIC + "status";
export const NOTICE_TOPIC_PREFIX = CLOCK_HEADER_TOPIC;
export const MODE_TOPIC_PREFIX = CLOCK_HEADER_TOPIC;
export const FIRMWARE_LOG_TOPIC_SUFFIX = CLOCK_HEADER_TOPIC + "ota/log";

export let mqttClient: MqttClient;

export const setupMqttClient = () => {
  mqttClient = mqtt.connect(secret.mqtt_broker_url, mqttOptions);

  mqttClient.on("connect", () => {
    logger.info({
      message: "Connected to MQTT broker",
      status: 200,
    });

    mqttClient.subscribe(CLOCK_HEADER_TOPIC + "#");
    // mqttClient.subscribe(STATUS_TOPIC);
    // mqttClient.subscribe(CLOCK_HEADER_TOPIC + "ota/control");
    // mqttClient.subscribe(`${NOTICE_TOPIC_PREFIX}+/notice`);
    // mqttClient.subscribe(`${MODE_TOPIC_PREFIX}+/mode`);
    // mqttClient.subscribe(FIRMWARE_LOG_TOPIC_SUFFIX);
    // mqttClient.subscribe("esp32/lwt");
  });

  mqttClient.on("message", handleMqttMessage);

  mqttClient.on("error", (err) => {
    logger.error({
      message: "MQTT Error:",
      status: 500,
      name: err.name,
      stack: err.stack,
    });
    // process.exit(1);
  });
};
