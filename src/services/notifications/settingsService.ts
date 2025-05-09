
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationSettings } from "./types";

// Get notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
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
      return {
        notify_device_offline: true,
        notify_low_battery: true,
        notify_security_issues: false,
        notify_new_device: true,
        email_notifications: null,
        telegram_bot_token: null,
        telegram_chat_id: null
      };
    }
    
    return data as NotificationSettings;
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    toast.error("Failed to load notification settings", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
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
