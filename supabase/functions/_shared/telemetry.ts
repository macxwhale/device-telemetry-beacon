
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Get Supabase credentials from environment
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://byvbunvegjwzgytavgkv.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Helper function to safely access nested properties in JSON
export function safelyGetNestedProperty(obj: any, path: string[], defaultValue: any = null): any {
  if (!obj) return defaultValue;
  
  try {
    // If obj is a string (which Json type can be), try to parse it
    const parsedObj = typeof obj === 'string' ? JSON.parse(obj) : obj;
    
    return path.reduce((prev: any, curr: string) => {
      return prev && typeof prev === 'object' ? prev[curr] : defaultValue;
    }, parsedObj);
  } catch (e) {
    console.error(`Error accessing path ${path.join('.')} in JSON:`, e);
    return defaultValue;
  }
}

// Get offline threshold setting from database
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
