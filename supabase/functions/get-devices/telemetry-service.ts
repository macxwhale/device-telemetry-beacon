
import { supabase } from "../_shared/telemetry.ts";

// Get latest telemetry data for a device from device_telemetry table
export async function getLatestDeviceTelemetry(deviceId: string) {
  try {
    const { data, error } = await supabase
      .from('device_telemetry')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.warn(`Error getting device_telemetry for device ${deviceId}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn(`Failed to query device_telemetry for device ${deviceId}:`, error);
    return null;
  }
}

// Get latest telemetry data for a device from telemetry_history table
export async function getLatestTelemetryHistory(deviceId: string) {
  const { data, error } = await supabase
    .from('telemetry_history')
    .select('telemetry_data, timestamp')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error) {
    console.error(`Error getting telemetry for device ${deviceId}:`, error);
    return null;
  }
  
  return data;
}

// Get all devices from the database
export async function getAllDevices() {
  const { data, error } = await supabase
    .from('devices')
    .select(`
      id,
      android_id,
      device_name,
      manufacturer,
      model,
      first_seen,
      last_seen
    `);
    
  if (error) {
    console.error("Error getting devices from database:", error);
    throw error;
  }
  
  return data || [];
}
