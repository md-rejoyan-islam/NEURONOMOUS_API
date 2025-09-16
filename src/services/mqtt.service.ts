import { STATUS_TOPIC } from "../config/mqtt";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { emitDeviceFirmwareUpdate } from "../socket";
import { logger } from "../utils/logger";
import clockService from "./devices/clock.service";

const DATA_TOPIC_PREFIX = "esp32/data/ntp/";
const FIRMWARE_LOG_TOPIC_SUFFIX = "/ota/log";

const macIds = new Set<string>();

export const handleMqttMessage = async (topic: string, message: Buffer) => {
  const msg = message.toString();

  console.log("mqtt message received", { topic, msg });

  try {
    if (topic === STATUS_TOPIC) {
      const payload = JSON.parse(msg);
      // console.log("mqtt payload", payload);

      const {
        id,
        macId,
        status,
        mode,
        notice,
        uptime,
        free_heap,
        firmware,
        boards,
        timestamp,
      } = payload;

      if ((macIds.has(macId) && status === "online") || status === "offline") {
        await clockService.updateDeviceStatusAndHandlePendingNotice(
          id,
          status,
          {
            uptime,
            mode,
            free_heap,
            notice,
            timestamp,
            firmware_version: firmware,
          }
        );
      } else {
        // Create or update device with the new status
        await clockService.createOrUpdateDevice({
          id,
          mac_id: macId,
          status,
          mode,
          notice,
          uptime,
          free_heap,
          type: boards == 1 ? "single" : "double",
          firmware_version: firmware,
          timestamp,
        });
      }
    } else if (topic.startsWith(DATA_TOPIC_PREFIX)) {
      console.log("under data topic", topic);

      const device_id = topic.split("/").pop()!;

      if (!device_id) {
        logger.warn("Received data message without device ID in topic:", topic);
        return;
      }

      const lines = msg.trim().split("\n");

      lines
        .filter((line) => line && !line.startsWith("NTP_TIME"))
        .map((line) => {
          const [ntp_time, rtc_before, rtc_after] = line.split(",");
          return { device_id, ntp_time, rtc_before, rtc_after, time: ntp_time };
        });

      // if (data.length > 0) {
      //   // Only perform operations if there's data to insert
      //   await DeviceDataModel.insertMany(data);
      // } else {
      //   errorLogger.warn(`Received empty data payload for device ${device_id}`);
      // }
    } else if (topic.endsWith("/notice")) {
      console.log("under notice topic", topic);

      const device_id = topic.split("/")[1];
      if (!device_id) {
        logger.warn(
          "Received notice message with invalid topic format:",
          topic
        );
        return;
      }
      // update the device's current notice in the database

      // ready do in service
      //   await updateDeviceService(device_id, {
      //     current_notice: msg,
      //   });

      // Use upsert: true here as well. This ensures that if a device sends a notice
      // before its first status update, its record is still created/updated.
      //   await DeviceModel.findOneAndUpdate(
      //     { id: device_id },
      //     {
      //       id: device_id, // Important: include ID for upsert to work correctly
      //       current_notice: msg,
      //       last_seen: dateFormat(new Date()), // Update last_seen on any device communication
      //     },
      //     { upsert: true, new: true }
      //   );
    } else if (topic.endsWith("/mode")) {
      // console.log("under mode topic", topic);

      const device_id = topic.split("/")[1];

      if (!device_id) {
        logger.warn("Received mode message with invalid topic format:", topic);
        return;
      }
      // const mode_text = msg === "0" ? "clock" : "notice";
      // Use upsert: true here too for consistency and robustness.

      // await updateDeviceService(device_id, {
      //   mode: mode_text,
      // });

      //   await DeviceModel.findOneAndUpdate(
      //     { id: device_id },
      //     {
      //       id: device_id, // Important: include ID for upsert to work correctly
      //       mode: mode_text,
      //       last_seen: dateFormat(new Date()), // Update last_seen on any device communication
      //     },
      //     { upsert: true, new: true }
      //   );
    } else if (topic.endsWith(FIRMWARE_LOG_TOPIC_SUFFIX)) {
      // console.log("under firmware log topic", topic);
      console.log("firmware log message", msg);

      // 'devices/clock/20:43:A8:64:9C:DC/ota/log',
      const device_mac_id = topic.split("/")[2];

      const device = await ClockDeviceModel.findOne({
        mac_id: device_mac_id,
      }).lean();

      // go to this message in client using socket.io
      emitDeviceFirmwareUpdate({
        id: device ? device._id.toString() : device_mac_id,
        status: msg,
      });

      // Here, you can also store the log in the database if needed.
    }
  } catch (err) {
    logger.error("MQTT message handling error:", err);
  }
};
