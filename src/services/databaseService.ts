
import { supabase } from "@/integrations/supabase/client";
import { DeviceStatus, DeviceHistory, TelemetryData } from "@/types/telemetry";
import { toast } from "sonner";

// Create a generic client type that allows us to access any table
const client = supabase as any;

// Initialize the database connection
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Initializing database connection...");
    
    // First call the database-functions edge function to create the necessary functions
    const { data: dbFunctionsResult, error: dbFunctionsError } = await supabase.functions.invoke('database-functions');
    
    if (dbFunctionsError) {
      console.error("Error initializing database functions:", dbFunctionsError);
      toast.error("Failed to initialize database functions");
      return false;
    }
    
    console.log("Database functions initialized:", dbFunctionsResult);
    
    // Now call the initialize-database function to create tables if they don't exist
    const { data: initResult, error: initError } = await supabase.functions.invoke('initialize-database');
    
    if (initError) {
      console.error("Error initializing database:", initError);
      toast.error("Failed to initialize database tables");
      return false;
    }
    
    console.log("Database tables initialized:", initResult);
    
    if (initResult?.success) {
      // Run checks to verify everything was created properly
      // First check if database tables exist
      const { data: tablesExist, error: tableCheckError } = await client.rpc(
        'execute_sql', 
        { 
          sql: `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'devices'
            ) as devices_exist,
            EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'telemetry_history'
            ) as telemetry_exist,
            EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'device_apps'
            ) as apps_exist
          `
        }
      );
      
      if (tableCheckError) {
        console.error("Error checking database tables:", tableCheckError);
        toast.error("Failed to verify database structure");
        return false;
      }
      
      if (!tablesExist || 
          !tablesExist.devices_exist || 
          !tablesExist.telemetry_exist || 
          !tablesExist.apps_exist) {
        console.error("Database tables don't exist after initialization attempt");
        toast.error("Failed to create database tables");
        return false;
      }
      
      console.log("Database tables exist, proceeding with trigger checks");
      
      // Add telemetry trigger if it doesn't exist
      const { error: triggerError } = await client.rpc('check_and_create_telemetry_trigger');
      
      if (triggerError) {
        console.error("Error creating trigger:", triggerError);
        toast.error("Failed to initialize database triggers");
        return false;
      }
      
      // Enable real-time updates
      const { error: realtimeError } = await client.rpc('enable_realtime_tables');
      
      if (realtimeError) {
        console.error("Error enabling realtime:", realtimeError);
        toast.error("Failed to enable realtime updates");
        return false;
      }
      
      console.log("Database connection initialized successfully");
      toast.success("Database connection initialized successfully");
      return true;
    } else {
      console.error("Database initialization failed:", initResult);
      toast.error("Failed to initialize database structure");
      return false;
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    toast.error("Failed to initialize database connection");
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
    console.log("Fetching database statistics...");
    
    // First check if database tables exist
    const { data: tablesExist, error: tableCheckError } = await client.rpc(
      'execute_sql', 
      { 
        sql: `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'devices'
          ) as devices_exist,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'telemetry_history'
          ) as telemetry_exist,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'device_apps'
          ) as apps_exist
        `
      }
    );
    
    if (tableCheckError || !tablesExist || 
        !tablesExist.devices_exist || 
        !tablesExist.telemetry_exist || 
        !tablesExist.apps_exist) {
      console.log("Database tables don't exist yet, returning zero counts");
      return {
        devices: 0,
        telemetry_records: 0,
        apps: 0
      };
    }
    
    const devicesResult = await client
      .from('devices')
      .select('id', { count: 'exact', head: true });
      
    const telemetryResult = await client
      .from('telemetry_history')
      .select('id', { count: 'exact', head: true });
      
    const appsResult = await client
      .from('device_apps')
      .select('id', { count: 'exact', head: true });
    
    console.log("Database stats:", {
      devices: devicesResult.count || 0,
      telemetry: telemetryResult.count || 0,
      apps: appsResult.count || 0
    });
    
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
    console.log(`Migrating ${devices.length} devices to database...`);
    let successCount = 0;
    
    // Check if tables exist first
    const { data: tablesExist, error: tableCheckError } = await client.rpc(
      'execute_sql', 
      { 
        sql: `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'devices'
          ) as devices_exist,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'telemetry_history'
          ) as telemetry_exist,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'device_apps'
          ) as apps_exist
        `
      }
    );
    
    if (tableCheckError || !tablesExist || 
        !tablesExist.devices_exist || 
        !tablesExist.telemetry_exist || 
        !tablesExist.apps_exist) {
      console.error("Cannot migrate data - tables don't exist");
      toast.error("Database tables don't exist. Please initialize database structure first.");
      return false;
    }
    
    for (const device of devices) {
      // First ensure the device exists
      const { data: existingDevice, error: deviceError } = await client
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
        const { data: newDevice, error: insertError } = await client
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
        console.log(`Created new device with ID ${deviceId}`);
      } else {
        deviceId = existingDevice.id;
        console.log(`Using existing device with ID ${deviceId}`);
      }
      
      // Add telemetry history
      if (device.telemetry) {
        // Convert telemetry to a known Json type by going through JSON stringify/parse
        const telemetryJson = JSON.parse(JSON.stringify(device.telemetry));
        const { error: telemetryError } = await client
          .from('telemetry_history')
          .insert({
            device_id: deviceId,
            timestamp: new Date(device.last_seen).toISOString(),
            telemetry_data: telemetryJson
          });
        
        if (telemetryError) {
          console.error(`Error inserting telemetry for device ${device.id}:`, telemetryError);
          continue;
        } else {
          console.log(`Added telemetry history for device ${device.id}`);
        }
      }
      
      // Add apps if present
      if (device.telemetry?.app_info?.installed_apps) {
        const apps = device.telemetry.app_info.installed_apps;
        console.log(`Adding ${apps.length} apps for device ${device.id}`);
        
        // Batch insert apps
        const appRows = apps.map(app => ({
          device_id: deviceId,
          app_package: app
        }));
        
        if (appRows.length > 0) {
          const { error: appsError } = await client
            .from('device_apps')
            .upsert(appRows, { 
              onConflict: 'device_id,app_package', 
              ignoreDuplicates: true 
            });
          
          if (appsError) {
            console.error(`Error inserting apps for device ${device.id}:`, appsError);
          } else {
            console.log(`Successfully added ${apps.length} apps for device ${device.id}`);
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

// Create a new execute_sql function to allow for safe SQL execution
export const executeSQL = async (sql: string): Promise<any> => {
  try {
    const { data, error } = await client.rpc('execute_sql', { sql });
    
    if (error) {
      console.error("Error executing SQL:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error executing SQL:", error);
    return { success: false, error };
  }
};
