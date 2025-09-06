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

const STATUS_TOPIC = "esp32/status";
const DATA_TOPIC_PREFIX = "esp32/data/ntp/";
const NOTICE_TOPIC_PREFIX = "device/";
const MODE_TOPIC_PREFIX = "device/";

export let mqttClient: MqttClient;

export const setupMqttClient = () => {
  mqttClient = mqtt.connect(secret.mqtt_broker_url, mqttOptions);

  mqttClient.on("connect", () => {
    logger.info({
      message: "Connected to MQTT broker",
      status: 200,
    });
    mqttClient.subscribe(STATUS_TOPIC);
    mqttClient.subscribe(`${DATA_TOPIC_PREFIX}#`);
    mqttClient.subscribe(`${NOTICE_TOPIC_PREFIX}+/notice`);
    mqttClient.subscribe(`${MODE_TOPIC_PREFIX}+/mode`);
    mqttClient.subscribe(`device/+/ota/log`);
    mqttClient.subscribe("esp32/lwt");
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
