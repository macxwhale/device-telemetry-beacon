
import { toast } from "sonner";

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
