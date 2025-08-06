export interface IDevice {
  id: string;
  status: string;
  last_seen: string;
  mode: string;
  current_notice: string;
  uptime: string;
  free_heap: number;
  timestamp: string;
}

export interface IDeviceData {
  ntp_time: string;
  rtc_before: string;
  rtc_after: string;
  time: string;
}

export interface ISuccessResponse {
  statusCode?: number;
  message?: string;
  payload?: object;
}

export interface IErrorResponse {
  success: boolean;
  message: string;
  errors: { path: string | number; message: string }[];
  stack?: string;
}
