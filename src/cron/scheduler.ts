// import cron from "node-cron";
// import { runExpireEventJob } from "../jobs/expire_event_job";

// type Job = {
//   id: string;
//   runAt: number; // Unix timestamp in ms
// };

// const jobDB: Map<string, Job> = new Map();

// export const scheduleExpireJob = (id: string, durationMs: number) => {
//   const runAt = Date.now() + durationMs;
//   jobDB.set(id, { id, runAt });

//   console.log(`🕒 Job ${id} scheduled for ${new Date(runAt).toUTCString()}`);
// };
// // check every minute for jobs that need to be run
// cron.schedule("* * * * *", () => {
//   const now = Date.now();

//   for (const [id, job] of jobDB.entries()) {
//     if (job.runAt <= now) {
//       runExpireEventJob(job.id);
//       jobDB.delete(job.id); // Clean up after execution
//     }
//   }
// });

// src/cron/scheduler.ts

import cron, { ScheduledTask } from "node-cron";
import {
  expireNoticeById,
  sendScheduledNotice,
} from "../services/device.service";

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
      expireNoticeById(deviceId);
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
    sendScheduledNotice(deviceId, scheduleId);
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
