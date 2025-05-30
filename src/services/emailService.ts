
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailNotificationData {
  deviceId: string;
  deviceName: string;
  message: string;
  type: 'device_offline' | 'low_battery' | 'security_issue' | 'new_device';
}

export const sendEmailNotification = async (data: EmailNotificationData): Promise<boolean> => {
  try {
    const response = await supabase.functions.invoke('send-email-notification', {
      body: data
    });

    if (response.error) {
      throw response.error;
    }

    console.log(`Email notification sent successfully for device ${data.deviceName}`);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    toast.error("Failed to send email notification", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};
