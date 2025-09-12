import cron, { ScheduledTask } from "node-cron";
import clockService from "../services/devices/clock.service";

// A map to store and manage cron jobs
const scheduledJobs = new Map<string, ScheduledTask>();

// Schedule a job to expire a notice and switch back to clock mode
export const scheduleExpireJob = (
  deviceId: string,
  durationInMinutes: number
) => {
  try {
    console.log(
      `Scheduling expire job for device ${deviceId} in ${durationInMinutes} minutes`
    );

    const job = cron.schedule(`*/${durationInMinutes} * * * *`, () => {
      clockService.expireNoticeById(deviceId);
      // Unschedule the job after it runs once
      job.destroy();
      scheduledJobs.delete(deviceId);
    });
    scheduledJobs.set(deviceId, job);
  } catch (error) {
    console.log(`Error scheduling expire job for device ${deviceId}:`, error);
  }
};

// Schedule a job to send a notice at a specific time
export const scheduleNoticeJob = (
  deviceId: string,
  scheduleId: string,
  durationInMinutes: number,
  startTime: Date
) => {
  // Convert startTime (Date) to a cron expression
  const minute = startTime.getMinutes();
  const hour = startTime.getHours();
  const day = startTime.getDate();
  const month = startTime.getMonth() + 1; // cron months are 1-based
  const cronExpr = `${minute} ${hour} ${day} ${month} *`;

  console.log("Scheduling notice job with cron expression:", cronExpr);
  console.log("all jobs", scheduledJobs);

  const job = cron.schedule(cronExpr, () => {
    clockService.sendScheduledNotice(deviceId, scheduleId);
    // Unschedule this job and schedule the expire job
    job.destroy();
    scheduledJobs.delete(deviceId);
    scheduleExpireJob(deviceId, durationInMinutes);
  });
  scheduledJobs.set(scheduleId, job);
  console.log("all jobs", scheduledJobs);
};

// Remove a scheduled job by its schedule ID
export const cancelScheduledNoticeJob = (scheduleId: string) => {
  const jobKey = scheduledJobs.get(scheduleId);
  if (jobKey) {
    jobKey.destroy();
    scheduledJobs.delete(scheduleId);
  } else {
    console.warn(`No job found for schedule ID: ${scheduleId}`);
  }
};
