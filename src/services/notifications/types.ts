
export interface NotificationSettings {
  id?: string;
  notify_device_offline: boolean;
  notify_low_battery: boolean;
  notify_security_issues: boolean;
  notify_new_device: boolean;
  email_notifications: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
}
