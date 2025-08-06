import cron from "node-cron";
import { runExpireEventJob } from "../jobs/expire_event_job";

type Job = {
  id: string;
  runAt: number; // Unix timestamp in ms
};

const jobDB: Map<string, Job> = new Map();

export const scheduleExpireJob = (id: string, durationMs: number) => {
  const runAt = Date.now() + durationMs;
  jobDB.set(id, { id, runAt });

  console.log(`🕒 Job ${id} scheduled for ${new Date(runAt).toUTCString()}`);
};
// check every minute for jobs that need to be run
cron.schedule("* * * * *", () => {
  const now = Date.now();

  for (const [id, job] of jobDB.entries()) {
    if (job.runAt <= now) {
      runExpireEventJob(job.id);
      jobDB.delete(job.id); // Clean up after execution
    }
  }
});
