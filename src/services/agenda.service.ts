import Agenda, { type Job } from "agenda";
import secret from "../app/secret";
import { ClockDeviceModel } from "../models/devices/clock.model";
import { Schedule } from "../models/schedule.model";
import clockService from "./devices/clock.service";

// Connect to MongoDB for Agenda
export const agenda = new Agenda({
  db: { address: secret.mongo_uri },
});

// Job: Start schedule
agenda.define("start-schedule", async (job: Job) => {
  console.log("Job data:", job.attrs.data);

  const { scheduleId } = job.attrs.data as { scheduleId: string };
  const schedule = await Schedule.findOne({
    _id: scheduleId,
    end_time: { $gt: Date.now() }, // only fetch if end_time > current time
  });
  if (!schedule) return;

  try {
    if (schedule.is_executed) return;

    console.log("🔔 Sending schedule:", schedule.category);

    // check device is online or offline
    const device = await ClockDeviceModel.findById(schedule.category.device_id);
    if (!device) throw new Error("Device not found");
    if (!device.status || device.status !== "online")
      throw new Error("Device is offline");

    // send schedule to device
    if (schedule.category.for === "notice") {
      await clockService.publishToDevice(
        device.mac_id,
        "notice",
        schedule.category.message || ""
      );
      // mode change to notice
      await clockService.publishToDevice(device.mac_id, "mode", "1");
    } else if (schedule.category.for === "timer") {
      const gmt6Offset = 6 * 60 * 60 * 1000;
      await clockService.publishToDevice(
        device.mac_id,
        "stopwatch",
        JSON.stringify({
          start_time: schedule.start_time + gmt6Offset,
          end_time: schedule.end_time + gmt6Offset,
          type: schedule.category.count_type === "up" ? 1 : 2,
        })
      );
    }

    schedule.is_executed = true;
    await schedule.save();
    console.log("✅ Schedule executed:", schedule._id);
  } catch {
    console.error("❌ Schedule failed, retry in 5 min:", schedule._id);

    // Retry after 5 minutes
    await agenda.schedule(
      new Date(Date.now() + 5 * 60 * 1000),
      "start-schedule",
      {
        scheduleId: schedule._id,
      }
    );
  }
});

// Job: End schedule
agenda.define("end-schedule", async (job: Job) => {
  const { scheduleId } = job.attrs.data as { scheduleId: string };
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) return;
  await Schedule.findByIdAndDelete(scheduleId);

  console.log("⏹️ Ending schedule:", schedule.category);
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
