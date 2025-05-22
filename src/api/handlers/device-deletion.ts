
// Handlers for device deletion operations

import { supabase } from "../../integrations/supabase/client";

/**
 * Delete a device and all related data
 */
export async function deleteDeviceFromApiImplementation(deviceId: string): Promise<{success: boolean; message: string}> {
  try {
    console.log(`Attempting to delete device with ID ${deviceId}`);
    
    // First check if device exists
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, android_id, device_name')
      .eq('android_id', deviceId)
      .maybeSingle();
    
    if (deviceError) {
      console.error("Error checking device existence:", deviceError);
      return { success: false, message: `Database error: ${deviceError.message}` };
    }
    
    if (!device) {
      console.error("Device not found:", deviceId);
      return { success: false, message: "Device not found" };
    }
    
    const deviceDbId = device.id;
    const deviceName = device.device_name || "Unknown device";
    
    // Delete all related records in this order (to respect foreign keys)
    const { error: appsError } = await supabase
      .from('device_apps')
      .delete()
      .eq('device_id', deviceDbId);
      
    if (appsError) console.error("Error deleting device apps:", appsError);
    
    const { error: telemetryError } = await supabase
      .from('device_telemetry')
      .delete()
      .eq('device_id', deviceDbId);
      
    if (telemetryError) console.error("Error deleting device telemetry:", telemetryError);
    
    const { error: historyError } = await supabase
      .from('telemetry_history')
      .delete()
      .eq('device_id', deviceDbId);
      
    if (historyError) console.error("Error deleting telemetry history:", historyError);
    
    // Finally delete the device record itself
    const { error: deleteError } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceDbId);
      
    if (deleteError) {
      console.error("Error deleting device:", deleteError);
      return { success: false, message: `Failed to delete device: ${deleteError.message}` };
    }
    
    console.log(`Successfully deleted device ${deviceName} (${deviceId}) with database ID ${deviceDbId}`);
    return { 
      success: true, 
      message: `Device ${deviceName} has been deleted along with all associated data` 
    };
  } catch (error) {
    console.error("Error in deleteDeviceFromApiImplementation:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${(error as Error).message}` 
    };
  }
}
