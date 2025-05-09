
import { supabase } from "@/integrations/supabase/client";
import { DeviceStatus, DeviceHistory, TelemetryData } from "@/types/telemetry";
import { toast } from "sonner";

// Initialize the database connection
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Add telemetry trigger if it doesn't exist
    const { error: triggerError } = await supabase.rpc('check_and_create_telemetry_trigger');
    
    if (triggerError) {
      console.error("Error creating trigger:", triggerError);
      return false;
    }
    
    // Enable real-time updates
    const { error: realtimeError } = await supabase.rpc('enable_realtime_tables');
    
    if (realtimeError) {
      console.error("Error enabling realtime:", realtimeError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
};

// Get database statistics
export const getDatabaseStats = async (): Promise<{ 
  devices: number;
  telemetry_records: number;
  apps: number;
} | null> => {
  try {
    // Use type assertion to bypass type checking for tables not in the type definition
    const devicesResult = await (supabase
      .from('devices') as any)
      .select('id', { count: 'exact', head: true });
      
    const telemetryResult = await (supabase
      .from('telemetry_history') as any)
      .select('id', { count: 'exact', head: true });
      
    // For tables not in the type definition, we need to use a more generic approach
    const appsResult = await (supabase
      .from('device_apps') as any)
      .select('id', { count: 'exact', head: true });
    
    return {
      devices: devicesResult.count || 0,
      telemetry_records: telemetryResult.count || 0,
      apps: appsResult.count || 0
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    return null;
  }
};

// Migrate in-memory data to database
export const migrateMemoryDataToDatabase = async (devices: DeviceStatus[]): Promise<boolean> => {
  try {
    let successCount = 0;
    
    for (const device of devices) {
      // First ensure the device exists
      const { data: existingDevice, error: deviceError } = await (supabase
        .from('devices') as any)
        .select('id')
        .eq('android_id', device.id)
        .maybeSingle();
      
      if (deviceError) {
        console.error(`Error checking device ${device.id}:`, deviceError);
        continue;
      }
      
      let deviceId: string;
      
      if (!existingDevice) {
        // Create device if it doesn't exist
        const { data: newDevice, error: insertError } = await (supabase
          .from('devices') as any)
          .insert({
            android_id: device.id,
            device_name: device.name,
            manufacturer: device.manufacturer,
            model: device.model,
            last_seen: new Date(device.last_seen).toISOString()
          })
          .select('id')
          .single();
        
        if (insertError || !newDevice) {
          console.error(`Error inserting device ${device.id}:`, insertError);
          continue;
        }
        
        deviceId = newDevice.id;
      } else {
        deviceId = existingDevice.id;
      }
      
      // Add telemetry history
      if (device.telemetry) {
        // Convert telemetry to a known Json type by going through JSON stringify/parse
        const telemetryJson = JSON.parse(JSON.stringify(device.telemetry));
        const { error: telemetryError } = await (supabase
          .from('telemetry_history') as any)
          .insert({
            device_id: deviceId,
            timestamp: new Date(device.last_seen).toISOString(),
            telemetry_data: telemetryJson
          });
        
        if (telemetryError) {
          console.error(`Error inserting telemetry for device ${device.id}:`, telemetryError);
          continue;
        }
      }
      
      // Add apps if present
      if (device.telemetry?.app_info?.installed_apps) {
        const apps = device.telemetry.app_info.installed_apps;
        for (const app of apps) {
          // For tables not in the type definition, we need to use a more generic approach
          const { error: appError } = await (supabase
            .from('device_apps') as any)
            .insert({
              device_id: deviceId,
              app_package: app
            });
          
          if (appError) {
            console.error(`Error inserting app ${app} for device ${device.id}:`, appError);
          }
        }
      }
      
      successCount++;
    }
    
    toast.success(`Migrated ${successCount} of ${devices.length} devices to database`);
    return true;
  } catch (error) {
    console.error("Error migrating memory data to database:", error);
    toast.error("Failed to migrate data to database");
    return false;
  }
};
