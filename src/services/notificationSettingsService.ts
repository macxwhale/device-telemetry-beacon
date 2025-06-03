
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationSettings {
  id?: string;
  notify_device_offline: boolean;
  notify_low_battery: boolean;
  notify_security_issues: boolean;
  notify_new_device: boolean;
  email_notifications: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  additional_settings?: {
    battery_threshold?: number;
    offline_threshold?: number;
  };
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
export const clearSettingsCache = () => {
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
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('notification_settings')
        .insert({
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
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
