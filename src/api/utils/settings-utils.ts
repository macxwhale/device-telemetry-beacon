
// Settings utilities for the telemetry API

import { supabase } from "../../integrations/supabase/client";

/**
 * Get offline threshold from database settings
 */
export async function getOfflineThreshold(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('additional_settings')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching offline threshold:", error);
      return 15; // Default to 15 minutes if error
    }
    
    // Extract offline_threshold from additional_settings if available
    const offlineThreshold = data?.additional_settings?.offline_threshold;
    return offlineThreshold || 15; // Default to 15 minutes if not found
  } catch (error) {
    console.error("Error in getOfflineThreshold:", error);
    return 15; // Default to 15 minutes on any error
  }
}
