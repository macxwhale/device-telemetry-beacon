
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneralSettings {
  system_name: string;
  offline_threshold: number;
  data_retention: number;
  auto_refresh: boolean;
}

export interface AppSettings {
  general: GeneralSettings;
  notification?: any; // We'll keep using the existing notification settings service
}

const defaultGeneralSettings: GeneralSettings = {
  system_name: "Device Telemetry Beacon",
  offline_threshold: 15,
  data_retention: 30,
  auto_refresh: true
};

// Get general settings from the database
export const getGeneralSettings = async (): Promise<GeneralSettings> => {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('additional_settings')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching general settings:", error);
      throw error;
    }
    
    // If no settings exist or additional_settings is null, return default settings
    if (!data || !data.additional_settings) {
      return defaultGeneralSettings;
    }
    
    // Merge with default settings to ensure all fields exist
    return {
      ...defaultGeneralSettings,
      ...data.additional_settings
    };
  } catch (error) {
    console.error("Error in getGeneralSettings:", error);
    toast.error("Failed to load general settings", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return defaultGeneralSettings;
  }
};

// Save general settings to the database
export const saveGeneralSettings = async (settings: GeneralSettings): Promise<boolean> => {
  try {
    const { data: existingSettings } = await supabase
      .from('notification_settings')
      .select('id, additional_settings')
      .limit(1)
      .maybeSingle();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('notification_settings')
        .update({
          additional_settings: settings,
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
          additional_settings: settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notify_device_offline: true,
          notify_low_battery: true,
          notify_security_issues: false,
          notify_new_device: true
        })
        .select('id')
        .single();
        
      if (error) throw error;
      result = { success: true, id: data.id };
    }
    
    toast.success("General settings saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving general settings:", error);
    toast.error("Failed to save general settings", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

// Create a context to provide settings throughout the application
export const createSettingsContext = () => {
  // This function will be implemented if we decide to create a Settings Context later
  console.log("Settings context creation is planned for future implementation");
};
