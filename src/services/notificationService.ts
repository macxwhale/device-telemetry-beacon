
// Re-export all functionality for backward compatibility
export type { NotificationSettings } from "./notificationSettingsService";
export type { NotificationType } from "./notificationSender";

export {
  getNotificationSettings,
  saveNotificationSettings,
  clearSettingsCache
} from "./notificationSettingsService";

export { sendNotification } from "./notificationSender";
export { sendTestNotification } from "./testNotificationService";
