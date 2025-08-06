import { DeviceDataModel } from "../models/device_data.model";

import { errorLogger } from "../utils/logger";
import { beforeAllDevices } from "../utils/query";
import {
  createDeviceService,
  sendNoticeToDeviceService,
  updateDeviceService,
} from "./device.service";

const STATUS_TOPIC = "esp32/status";
const DATA_TOPIC_PREFIX = "esp32/data/ntp/";

// Initialize devices as an empty object
let devices: { [key: string]: string } = {};

// Asynchronously load devices before handling messages
(async () => {
  devices = await beforeAllDevices();
})();

export const handleMqttMessage = async (topic: string, message: Buffer) => {
  const msg = message.toString();

  try {
    if (topic === STATUS_TOPIC) {
      const payload = JSON.parse(msg);
      const device_id = payload.id;
      const status = payload.status;
      //   console.log("payload", payload);

      console.log("payload", payload);

      if (!device_id)
        return errorLogger.warn(
          "Received status message without device ID:",
          msg
        );

      // Check if the device ID is already in the devices object
      if (device_id in devices) {
        // if go to offline, status change
        if (status === "offline" && devices[device_id] !== "offline") {
          // status change to offline
          devices[device_id] = status;

          // Update the device status in the database
          await updateDeviceService(device_id, {
            status,
          });
        } else if (status === "online" && devices[device_id] !== "online") {
          devices[device_id] = status;

          // Update the device status in the database
          const device = await updateDeviceService(device_id, {
            status,
          });

          // If the device has a pending notice, send it
          if (device?.pending_notice) {
            await sendNoticeToDeviceService(
              device_id,
              device.current_notice,
              device.duration,
              true
            );
            // Reset pending_notice after sending
            device.pending_notice = false;
          }
        }
      } else {
        // If the device is not in the list, add it
        devices[device_id] = status;

        // create a new device record in the database
        return await createDeviceService({
          id: device_id,
          status,
          mode: payload.mode || "clock",
          current_notice: payload.notice,
          uptime: payload.uptime,
          free_heap: payload.free_heap,
          timestamp: payload.timestamp,
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

      const data = lines
        .filter((line) => line && !line.startsWith("NTP_TIME"))
        .map((line) => {
          const [ntp_time, rtc_before, rtc_after] = line.split(",");
          return { device_id, ntp_time, rtc_before, rtc_after, time: ntp_time };
        });

      if (data.length > 0) {
        // Only perform operations if there's data to insert
        await DeviceDataModel.insertMany(data);
      } else {
        errorLogger.warn(`Received empty data payload for device ${device_id}`);
      }
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
      const mode_text = msg === "0" ? "clock" : "notice";
      // Use upsert: true here too for consistency and robustness.

      await updateDeviceService(device_id, {
        mode: mode_text,
      });

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
