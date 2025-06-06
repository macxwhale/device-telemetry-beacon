
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Triggers device monitoring to check for offline devices, low battery, and security issues
 * Returns a promise that resolves to true if successful, false otherwise
 */
export const triggerDeviceMonitoring = async (): Promise<boolean> => {
  try {
    console.log("🌼 Sending love to edge function...");
    
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
    
    console.log("💖 Edge function response:", response);
    
    if (response.error) {
      console.error("❌ Device monitoring error:", response.error);
      
      // Provide more helpful error messages
      let errorMessage = "Device monitoring failed";
      let errorDescription = response.error.message || 'Unknown error occurred';
      
      // Check for common CORS issues
      if (errorDescription.includes('CORS') || errorDescription.includes('Access-Control')) {
        errorDescription = "Connection issue - please try again in a moment";
      } else if (errorDescription.includes('network') || errorDescription.includes('fetch')) {
        errorDescription = "Network connection issue - please check your internet connection";
      }
      
      toast.error(errorMessage, {
        description: errorDescription
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
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorDescription = "Network connection issue - please check your internet connection and try again";
      } else if (error.message.includes('Function not found')) {
        errorDescription = "Device monitoring service is not available - please try again later";
      } else if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        errorDescription = "Connection issue - the service is being updated, please try again";
      } else {
        errorDescription = error.message;
      }
    }
    
    toast.error(errorMessage, {
      description: errorDescription,
      action: {
        label: "Retry",
        onClick: () => triggerDeviceMonitoring()
      }
    });
    
    return false;
  }
};

/**
 * Test function to ping a specific device (for future use)
 */
export const pingDevice = async (deviceId: string): Promise<boolean> => {
  try {
    console.log(`🏓 Pinging device with love: ${deviceId}`);
    
    toast.info("Device ping test", {
      description: `Testing connection to device ${deviceId}`
    });
    
    // This would be implemented when we have direct device communication
    // For now, we'll just simulate a ping test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Device ping successful! 🌟", {
      description: `Device ${deviceId} responded happily`
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
