
import { DeviceNotificationTracker } from "./deviceNotificationTracker";
import { sendEmailNotification } from "./emailService";
import { getNotificationSettings } from "./notificationSettingsService";

export type NotificationType = 'device_offline' | 'low_battery' | 'security_issue' | 'new_device';

// Send a notification with improved rate limiting and device age checking
export const sendNotification = async (
  deviceId: string,
  deviceName: string,
  message: string,
  type: NotificationType
): Promise<boolean> => {
  try {
    // Check if we can send notification (includes device age and rate limiting)
    if (!(await DeviceNotificationTracker.canSendNotification(deviceId, type))) {
      return false; // Skip sending due to rate limit or device age
    }

    const settings = await getNotificationSettings();
    if (!settings) {
      console.error("No notification settings available");
      return false;
    }

    // Check if this notification type is enabled
    let shouldSend = false;
    switch (type) {
      case 'device_offline':
        shouldSend = settings.notify_device_offline;
        break;
      case 'low_battery':
        shouldSend = settings.notify_low_battery;
        break;
      case 'security_issue':
        shouldSend = settings.notify_security_issues;
        break;
      case 'new_device':
        shouldSend = settings.notify_new_device;
        break;
    }

    if (!shouldSend) {
      console.log(`Notification type '${type}' is disabled`);
      return false;
    }

    let notificationSent = false;

    // Send Telegram notification if configured
    if (settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        const supabaseUrl = "https://byvbunvegjwzgytavgkv.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dmJ1bnZlZ2p3emd5dGF2Z2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzM3MzMsImV4cCI6MjA2MjM0OTczM30.JaYx-kQuM2_L2li9I3a0fy9bUIwFP1e40iIRM7gVBFA";
        
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            message,
            type,
            deviceId,
            deviceName
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          notificationSent = true;
          console.log(`Telegram notification sent successfully for device ${deviceName}`);
        } else {
          console.error("Telegram notification failed:", result.error);
        }
      } catch (error) {
        console.error("Error sending Telegram notification:", error);
      }
    }

    // Send email notification if configured
    if (settings.email_notifications) {
      try {
        const emailSent = await sendEmailNotification({
          deviceId,
          deviceName,
          message,
          type
        });
        if (emailSent) {
          notificationSent = true;
        }
      } catch (error) {
        console.error("Error sending email notification:", error);
      }
    }

    // Mark notification as sent if any channel succeeded
    if (notificationSent) {
      await DeviceNotificationTracker.markNotificationSent(deviceId, type);
      console.log(`Notification sent successfully for device ${deviceName} (${deviceId}): ${message}`);
    }

    return notificationSent;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};
