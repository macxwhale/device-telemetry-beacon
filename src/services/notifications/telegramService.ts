
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getNotificationSettings } from "./settingsService";

// Send a test notification via Telegram
export const sendTelegramTestNotification = async (
  botToken: string | null, 
  chatId: string | null
): Promise<boolean> => {
  try {
    if (!botToken || !chatId) {
      toast.error("Telegram bot token and chat ID are required");
      return false;
    }
    
    // Get the Supabase URL directly
    const supabaseUrl = "https://byvbunvegjwzgytavgkv.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dmJ1bnZlZ2p3emd5dGF2Z2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzM3MzMsImV4cCI6MjA2MjM0OTczM30.JaYx-kQuM2_L2li9I3a0fy9bUIwFP1e40iIRM7gVBFA";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase URL or anon key");
      toast.error("Configuration error", { 
        description: "Supabase URL or anon key is missing" 
      });
      return false;
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        botToken: botToken,
        chatId: chatId,
        message: "This is a test notification from Device Telemetry",
        type: "test"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from send-notification function:", errorText);
      let errorMessage = "Failed to send test notification";
      
      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text (truncated if too long)
        errorMessage = errorText.length > 100 ? 
          `${errorText.substring(0, 100)}...` : errorText;
      }
      
      throw new Error(errorMessage);
    }
    
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

// New function to send any type of notification via Telegram
export const sendTelegramNotification = async (
  message: string,
  type: 'new_device' | 'device_offline' | 'low_battery' | 'security_issue'
): Promise<boolean> => {
  try {
    // Fetch notification settings to check if this notification type is enabled
    // and to get the Telegram credentials
    const settings = await getNotificationSettings();
    
    if (!settings) {
      console.log("No notification settings found, skipping Telegram notification");
      return false;
    }
    
    // Check if this type of notification is enabled
    const isEnabled = checkIfNotificationTypeEnabled(settings, type);
    if (!isEnabled) {
      console.log(`${type} notifications are disabled in settings, skipping Telegram notification`);
      return false;
    }
    
    // Check if Telegram is configured
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      console.log("Telegram is not configured, skipping notification");
      return false;
    }
    
    // Get the Supabase URL and key
    const supabaseUrl = "https://byvbunvegjwzgytavgkv.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5dmJ1bnZlZ2p3emd5dGF2Z2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzM3MzMsImV4cCI6MjA2MjM0OTczM30.JaYx-kQuM2_L2li9I3a0fy9bUIwFP1e40iIRM7gVBFA";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase URL or anon key");
      return false;
    }
    
    // Send the notification using our edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        botToken: settings.telegram_bot_token,
        chatId: settings.telegram_chat_id,
        message: message,
        type: type
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from send-notification function:", errorText);
      return false;
    }
    
    const result = await response.json();
    if (!result.success) {
      console.error("Function reported error:", result.error);
      return false;
    }
    
    const telegramResult = result.results.find((r: any) => r.channel === 'telegram');
    if (!telegramResult || !telegramResult.success) {
      console.error("Telegram notification failed:", telegramResult?.error);
      return false;
    }
    
    console.log(`Telegram notification for ${type} sent successfully`);
    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
};

// Helper function to check if a specific notification type is enabled
function checkIfNotificationTypeEnabled(
  settings: any, 
  type: 'new_device' | 'device_offline' | 'low_battery' | 'security_issue'
): boolean {
  switch (type) {
    case 'new_device':
      return !!settings.notify_new_device;
    case 'device_offline':
      return !!settings.notify_device_offline;
    case 'low_battery':
      return !!settings.notify_low_battery;
    case 'security_issue':
      return !!settings.notify_security_issues;
    default:
      return false;
  }
}
