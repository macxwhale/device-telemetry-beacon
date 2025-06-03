
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Triggers device monitoring to check for offline devices, low battery, and security issues
 */
export const triggerDeviceMonitoring = async (): Promise<boolean> => {
  try {
    console.log("Triggering device monitoring...");
    
    const response = await supabase.functions.invoke('device-monitor', {
      body: {}
    });
    
    if (response.error) {
      console.error("Error triggering device monitoring:", response.error);
      toast.error("Failed to trigger device monitoring", {
        description: response.error.message
      });
      return false;
    }
    
    console.log("Device monitoring triggered successfully:", response.data);
    toast.success("Device monitoring completed", {
      description: "Checked for offline devices, low battery, and security issues"
    });
    return true;
  } catch (error) {
    console.error("Error in triggerDeviceMonitoring:", error);
    toast.error("Failed to trigger device monitoring", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};
