import { errorLogger } from "../utils/logger";
import {
  createOrUpdateDeviceService,
  updateDeviceStatusAndHandlePendingNotice,
} from "./device.service";

const STATUS_TOPIC = "esp32/status";
const DATA_TOPIC_PREFIX = "esp32/data/ntp/";

export const handleMqttMessage = async (topic: string, message: Buffer) => {
  const msg = message.toString();

  try {
    if (topic === STATUS_TOPIC) {
      const payload = JSON.parse(msg);
      console.log("mqtt payload", payload);

      const {
        id,
        macId,
        status,
        mode,
        notice,
        uptime,
        free_heap,
        firmware,
        type,
      } = payload;

      if (!id || !macId || !status || !mode || !firmware || !type) {
        return errorLogger.warn(
          "Received status message with missing fields:",
          msg
        );
      }

      // console.log("payload", payload);

      if (!id)
        return errorLogger.warn(
          "Received status message without device ID:",
          msg
        );
      if (status === "online" || status === "offline") {
        await updateDeviceStatusAndHandlePendingNotice(id, status, {
          uptime,
          mode,
          free_heap,
          notice,
          mac_id: macId,
          type: type || "single",
          firmware_version: firmware,
        });
      } else {
        console.log("changing device status to", status, "for ID:", id);

        // Create or update device with the new status
        await createOrUpdateDeviceService({
          id,
          mac_id: macId,
          status,
          mode,
          notice,
          uptime,
          free_heap,
          type: type || "single",
          firmware_version: firmware,
        });
      }
    } else if (topic.startsWith(DATA_TOPIC_PREFIX)) {
      console.log("under data topic", topic);

      const device_id = topic.split("/").pop()!;

      if (!device_id) {
        errorLogger.warn(
          "Received data message without device ID in topic:",
          topic
        );
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
        errorLogger.warn(
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
      console.log("under mode topic", topic);

      const device_id = topic.split("/")[1];

      if (!device_id) {
        errorLogger.warn(
          "Received mode message with invalid topic format:",
          topic
        );
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
    }
  } catch (err) {
    errorLogger.error("MQTT message handling error:", err);
  }
};
