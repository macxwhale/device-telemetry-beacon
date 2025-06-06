
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Triggers device monitoring to check for offline devices, low battery, and security issues
 * Returns a promise that resolves to true if successful, false otherwise
 */
export const triggerDeviceMonitoring = async (): Promise<boolean> => {
  try {
    console.log("🔍 Starting device monitoring check...");
    
    // Show a nice loading toast
    const loadingToast = toast.loading("Checking device status...", {
      description: "Scanning for offline devices, low battery, and security issues"
    });
    
    const response = await supabase.functions.invoke('device-monitor', {
      body: {
        timestamp: new Date().toISOString(),
        source: 'manual_trigger'
      }
    });
    
    // Dismiss the loading toast
    toast.dismiss(loadingToast);
    
    if (response.error) {
      console.error("❌ Device monitoring error:", response.error);
      toast.error("Device monitoring failed", {
        description: `Error: ${response.error.message || 'Unknown error occurred'}`
      });
      return false;
    }
    
    console.log("✅ Device monitoring completed successfully:", response.data);
    
    // Show success with details
    toast.success("Device monitoring completed! 🎉", {
      description: "All devices have been checked for issues"
    });
    
    return true;
  } catch (error) {
    console.error("💥 Exception in triggerDeviceMonitoring:", error);
    
    // Provide helpful error messages based on the error type
    let errorMessage = "Failed to trigger device monitoring";
    let errorDescription = "Unknown error occurred";
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorDescription = "Network connection issue - please check your internet connection";
      } else if (error.message.includes('Function not found')) {
        errorDescription = "Device monitoring service is not available";
      } else {
        errorDescription = error.message;
      }
    }
    
    toast.error(errorMessage, {
      description: errorDescription
    });
    
    return false;
  }
};

/**
 * Test function to ping a specific device (for future use)
 */
export const pingDevice = async (deviceId: string): Promise<boolean> => {
  try {
    console.log(`🏓 Pinging device: ${deviceId}`);
    
    // This would be implemented when we have direct device communication
    // For now, we'll just simulate a ping test
    toast.info("Device ping test", {
      description: `Testing connection to device ${deviceId}`
    });
    
    return true;
  } catch (error) {
    console.error("❌ Device ping failed:", error);
    toast.error("Device ping failed", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};
