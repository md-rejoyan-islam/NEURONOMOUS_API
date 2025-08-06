import { expireNoticeById } from "../services/device.service";

export const runExpireEventJob = async (id: string) => {
  try {
    console.log(`Running job to expire with ID: ${id}`);
    await expireNoticeById(id);
  } catch (err) {
    console.error("Error running expire event job:", err);
  }
};
