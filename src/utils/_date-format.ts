export const dateFormat = (dt: Date | number | string): string => {
  const isoString = new Date(dt).toISOString();
  const date = new Date(isoString);

  const day = date.getUTCDate();
  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const year = date.getUTCFullYear();

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year} : ${hours}:${minutes} ${ampm} UTC`;
};

/**
 * Convert a number of bytes into a human-readable string (KB, MB, etc.)
 * @param bytes - The number of bytes
 * @param decimals - Number of decimal points to show (default is 2)
 * @returns A formatted string like "179.11 KB" or "0.17 MB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${size} ${sizes[i]}`;
}
