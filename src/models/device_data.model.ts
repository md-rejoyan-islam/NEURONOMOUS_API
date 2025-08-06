import mongoose from "mongoose";

const DeviceDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  ntp_time: { type: String, required: true },
  rtc_before: { type: String, required: true },
  rtc_after: { type: String, required: true },
  time: { type: String, required: true },
});

export const DeviceDataModel = mongoose.model("DeviceData", DeviceDataSchema);
