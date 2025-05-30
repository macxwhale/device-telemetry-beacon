
import type { NotificationRequest } from './types.ts';

export function validateNotificationRequest(request: NotificationRequest): string | null {
  if (!request.message || !request.type) {
    return "Missing required parameters: message and type";
  }
  return null;
}

export function shouldSendNotificationType(type: string, settings: any): boolean {
  switch (type) {
    case 'device_offline':
      return settings.notify_device_offline;
    case 'low_battery':
      return settings.notify_low_battery;
    case 'security_issue':
      return settings.notify_security_issues;
    case 'new_device':
      return settings.notify_new_device;
    case 'test':
      // Always send test notifications
      return true;
    default:
      return false;
  }
}
