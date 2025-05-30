
export interface NotificationRequest {
  message: string;
  type: 'device_offline' | 'low_battery' | 'security_issue' | 'new_device' | 'test';
  deviceId?: string;
  deviceName?: string;
}

export interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
  response?: any;
  message?: string;
}

export interface NotificationResponse {
  success: boolean;
  results?: NotificationResult[];
  message?: string;
  sent?: boolean;
  reason?: string;
  rateLimited?: boolean;
  error?: string;
}
