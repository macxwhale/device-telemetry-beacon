
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeviceNotificationTracker } from "./deviceNotificationTracker";
import { sendEmailNotification } from "./emailService";

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

// Cache for notification settings to reduce database calls
let settingsCache: NotificationSettings | null = null;
let settingsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get notification settings with caching
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    // Check cache first
    const now = Date.now();
    if (settingsCache && (now - settingsCacheTime) < CACHE_DURATION) {
      return settingsCache;
    }

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching notification settings:", error);
      throw error;
    }
    
    // If no settings exist, return default settings
    if (!data) {
      settingsCache = {
        notify_device_offline: true,
        notify_low_battery: true,
        notify_security_issues: false,
        notify_new_device: true,
        email_notifications: null,
        telegram_bot_token: null,
        telegram_chat_id: null
      };
    } else {
      settingsCache = data as NotificationSettings;
    }
    
    settingsCacheTime = now;
    return settingsCache;
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    toast.error("Failed to load notification settings", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
};

// Clear settings cache when settings are updated
const clearSettingsCache = () => {
  settingsCache = null;
  settingsCacheTime = 0;
};

// Save notification settings
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<boolean> => {
  try {
    const { data: existingSettings } = await supabase
      .from('notification_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('notification_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);
        
      if (error) throw error;
      result = { success: true, id: existingSettings.id };
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (error) throw error;
      result = { success: true, id: data.id };
    }
    
    // Clear cache when settings are updated
    clearSettingsCache();
    
    toast.success("Notification settings saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving notification settings:", error);
    toast.error("Failed to save notification settings", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

// Send a notification with improved rate limiting and device age checking
export const sendNotification = async (
  deviceId: string,
  deviceName: string,
  message: string,
  type: 'device_offline' | 'low_battery' | 'security_issue' | 'new_device'
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

// Send a test notification
export const sendTestNotification = async (
  botToken: string | null, 
  chatId: string | null
): Promise<boolean> => {
  try {
    if (!botToken || !chatId) {
      toast.error("Telegram bot token and chat ID are required");
      return false;
    }
    
    const supabaseUrl = "https://byvbunvegjwzgytavgkv.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dmJ1bnZlZ2p3emd5dGF2Z2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzM3MzMsImV4cCI6MjA2MjM0OTczM30.JaYx-kQuM2_L2li9I3a0fy9bUIwFP1e40iIRM7gVBFA";
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        message: "This is a test notification from Device Telemetry",
        type: "test"
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || "Failed to send test notification");
    }
    
    const telegramResult = result.results.find((r: any) => r.channel === 'telegram');
    if (!telegramResult || !telegramResult.success) {
      throw new Error(telegramResult?.error || "Telegram notification failed");
    }
    
    toast.success("Test notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    toast.error("Failed to send test notification", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};
