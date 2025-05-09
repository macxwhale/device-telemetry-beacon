
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
}

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
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`
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
