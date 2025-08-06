import { DeviceModel } from "../models/device.model";

export const beforeAllDevices = async () => {
  const devices = await DeviceModel.find().select("id status").lean();

  const result = devices.reduce<Record<string, any>>((acc, device) => {
    acc[device.id] = device.status;
    return acc;
  }, {});
  console.log(result);
  return result;
};
