
import { toast } from "sonner";

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
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
