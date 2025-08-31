import os from "os";
import si from "systeminformation";

export const getMemoryDetailsService = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const memoryUsagePercent = (used / total) * 100;

  return {
    total,
    free,
    used,
    memoryUsagePercent: memoryUsagePercent.toFixed(2), // %
  };
};

export const getCpuDetailsService = async () => {
  const cpu = await si.currentLoad(); // CPU load info

  const cores = os.cpus().length;
  const cpuUsagePercent = cpu.currentLoad;
  return {
    cores,
    cpuUsagePercent: cpuUsagePercent.toFixed(2),
  };
};
