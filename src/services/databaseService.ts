
import { supabase } from "@/integrations/supabase/client";
import { DeviceStatus, DeviceHistory, TelemetryData } from "@/types/telemetry";
import { toast } from "sonner";

// Initialize the database connection
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Add telemetry trigger if it doesn't exist
    const { error: triggerError } = await supabase.query(`
      DO $$
      BEGIN
        -- Create trigger if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger 
          WHERE tgname = 'telemetry_data_trigger'
        ) THEN
          CREATE TRIGGER telemetry_data_trigger
            BEFORE INSERT ON public.telemetry_history
            FOR EACH ROW
            EXECUTE FUNCTION public.process_telemetry_data();
        END IF;
      END
      $$;
    `);
    
    if (triggerError) {
      console.error("Error creating trigger:", triggerError);
      return false;
    }
    
    // Enable real-time updates
    const { error: realtimeError } = await supabase.query(`
      ALTER TABLE public.devices REPLICA IDENTITY FULL;
      ALTER TABLE public.telemetry_history REPLICA IDENTITY FULL;
      
      -- Add table to realtime publication if not already added
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'devices'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'telemetry_history'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_history;
        END IF;
      END
      $$;
    `);
    
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
    const [devicesResult, telemetryResult, appsResult] = await Promise.all([
      supabase.from('devices').select('id', { count: 'exact', head: true }),
      supabase.from('telemetry_history').select('id', { count: 'exact', head: true }),
      supabase.from('device_apps').select('id', { count: 'exact', head: true })
    ]);
    
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
      const { data: existingDevice, error: deviceError } = await supabase
        .from('devices')
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
        const { data: newDevice, error: insertError } = await supabase
          .from('devices')
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
        const { error: telemetryError } = await supabase
          .from('telemetry_history')
          .insert({
            device_id: deviceId,
            timestamp: new Date(device.last_seen).toISOString(),
            telemetry_data: device.telemetry
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
          const { error: appError } = await supabase
            .from('device_apps')
            .insert({
              device_id: deviceId,
              app_package: app
            })
            .onConflict(['device_id', 'app_package'])
            .ignore();
          
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
