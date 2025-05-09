
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    
    // Use the Supabase URL and anon key from the supabase client
    const supabaseUrl = supabase.supabaseUrl;
    const supabaseAnonKey = supabase.supabaseKey;
    
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
