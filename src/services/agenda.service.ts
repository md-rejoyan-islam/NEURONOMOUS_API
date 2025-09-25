import Agenda, { type Job } from "agenda";
import secret from "../app/secret";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { emitDeviceStatusUpdate } from "../socket";
import clockService from "./devices/clock.service";

// Connect to MongoDB for Agenda
export const agenda = new Agenda({
  db: { address: secret.mongo_uri },
});

// Job: Start schedule
agenda.define("start-schedule", async (job: Job) => {
  const { scheduleId: scheduleIdWithType } = job.attrs.data as {
    scheduleId: string;
  };
  // device type and schedule id are separated by "-"
  const [deviceType, scheduleId] = scheduleIdWithType.split("-");

  try {
    if (deviceType === "stopwatch") {
      const clockDevice = await ClockDeviceModel.findOne(
        {
          "stopwatches._id": scheduleId,
        },
        { "stopwatches.$": 1, status: 1, mac_id: 1, id: 1 }
      );

      if (!clockDevice) throw new Error("Clock device not found");

      console.log("🔔 Sending schedule:", scheduleId);

      if (!clockDevice.status || clockDevice.status !== "online")
        throw new Error("Device is offline");

      const schedule = clockDevice?.stopwatches[0] || [];

      // socket update
      emitDeviceStatusUpdate({ id: clockDevice.id });

      const gmt6Offset = 6 * 60 * 60 * 1000;
      await clockService.publishToDevice(
        clockDevice.mac_id,
        "stopwatch",
        JSON.stringify({
          start_time: schedule.start_time + gmt6Offset,
          end_time: schedule.end_time + gmt6Offset,
          type: schedule.count_type === "up" ? 2 : 1,
        })
      );
      await ClockDeviceModel.updateOne(
        {
          _id: clockDevice._id,
          "stopwatches._id": scheduleId,
        },
        {
          $set: { "stopwatches.$.is_executed": true, mode: "stopwatch" },
        }
      ).exec();

      console.log("✅ Schedule executed:", scheduleId);
    }
  } catch {
    console.error("❌ Schedule failed.", scheduleId);
  }
});

// Job: End schedule
agenda.define("end-schedule", async (job: Job) => {
  // const { scheduleId } = job.attrs.data as { scheduleId: string };
  const { scheduleId: scheduleIdWithType } = job.attrs.data as {
    scheduleId: string;
  };

  const [deviceType, scheduleId] = scheduleIdWithType.split("-");
  console.log(deviceType);

  console.log("agenda end scheduled");

  const clockDevice = await ClockDeviceModel.findOne(
    {
      "stopwatches._id": scheduleId,
    },
    { "stopwatches.$": 1, status: 1, mac_id: 1, id: 1 }
  );

  console.log("clockDevice", clockDevice);

  if (!clockDevice) return;

  await ClockDeviceModel.updateOne(
    { _id: clockDevice._id },
    {
      $pull: { stopwatches: { _id: scheduleId } },
      mode: "clock",
    }
  );

  // socket update
  emitDeviceStatusUpdate({ id: clockDevice?.id });

  // const schedule = await Schedule.findById(scheduleId);
  // if (!schedule) return;
  // await Schedule.findByIdAndDelete(scheduleId);

  console.log("⏹️ Ending schedule:", scheduleId);
});

// agenda.define("cleanup-expired-schedules", async () => {
//   const result = await Schedule.deleteMany({ end_time: { $lt: Date.now() } });
//   if (result.deletedCount && result.deletedCount > 0) {
//     console.log(`🗑️ Deleted ${result.deletedCount} expired schedules`);
//   }
// });

// Start agenda
const startAgenda = async () => {
  await agenda.start();
  console.log("🗓️ Agenda started");
  // Run every 5 minutes
  //   await agenda.every("5 minutes", "cleanup-expired-schedules");
};

export default startAgenda;
