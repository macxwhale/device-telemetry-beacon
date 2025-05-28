
// Settings utilities for the telemetry API

import { supabase } from "../../integrations/supabase/client";

// Cache for offline threshold to reduce database calls
let offlineThresholdCache: number | null = null;
let offlineThresholdCacheTime = 0;
const OFFLINE_THRESHOLD_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get offline threshold from database settings with caching
 */
export async function getOfflineThreshold(): Promise<number> {
  try {
    // Check cache first
    const now = Date.now();
    if (offlineThresholdCache !== null && (now - offlineThresholdCacheTime) < OFFLINE_THRESHOLD_CACHE_DURATION) {
      return offlineThresholdCache;
    }

    const { data, error } = await supabase
      .from('notification_settings')
      .select('additional_settings')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching offline threshold:", error);
      offlineThresholdCache = 15; // Default to 15 minutes if error
      offlineThresholdCacheTime = now;
      return offlineThresholdCache;
    }
    
    // Extract offline_threshold from additional_settings if available
    const offlineThreshold = data?.additional_settings?.offline_threshold || 15;
    
    // Update cache
    offlineThresholdCache = offlineThreshold;
    offlineThresholdCacheTime = now;
    
    // Only log once when cache is updated, not on every call
    console.info("Updated offline threshold cache:", offlineThreshold, "minutes");
    
    return offlineThreshold;
  } catch (error) {
    console.error("Error in getOfflineThreshold:", error);
    offlineThresholdCache = 15; // Default to 15 minutes on any error
    offlineThresholdCacheTime = now;
    return offlineThresholdCache;
  }
}

/**
 * Clear the offline threshold cache (call when settings are updated)
 */
export function clearOfflineThresholdCache(): void {
  offlineThresholdCache = null;
  offlineThresholdCacheTime = 0;
}
