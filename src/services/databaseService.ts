
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Create a generic client type that allows us to access any table
const client = supabase as any;

// Initialize the database connection and ensure tables exist
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Initializing database connection...");
    const initialToast = toast.loading("Initializing database connection...", {
      duration: 6000,
    });
    
    // First check if database tables exist
    console.log("Checking if database tables exist...");
    
    try {
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
      
      // If all tables exist, we're done
      if (tablesExist && 
          tablesExist[0].devices_exist && 
          tablesExist[0].telemetry_exist && 
          tablesExist[0].apps_exist) {
        console.log("All database tables already exist");
        
        toast.success("Database verification complete", {
          description: "All required tables already exist",
          duration: 3000,
          id: initialToast,
        });
        
        // Check if realtime is enabled
        try {
          await client.rpc('enable_realtime_tables');
          console.log("Realtime tables enabled or verified");
          toast.success("Realtime tables enabled", {
            description: "You'll receive live telemetry updates as they come in",
            duration: 3000,
          });
        } catch (realtimeError) {
          console.error("Error enabling realtime:", realtimeError);
          toast.error("Failed to enable realtime updates", {
            description: "Telemetry updates may not appear in real-time",
            duration: 4000,
          });
        }
        
        return true;
      }
      
      // Some tables are missing, need to create them
      console.log("Some tables missing, creating database tables...");
      toast.loading("Creating database tables...", {
        id: initialToast,
        duration: 10000,
      });
      
    } catch (tableCheckError) {
      console.error("Error checking database tables:", tableCheckError);
      
      // Need to create the execute_sql function first
      console.log("Setting up database functions...");
      toast.loading("Setting up database functions...", {
        id: initialToast,
      });
      
      try {
        const { data: dbFunctionsResult, error: dbFunctionsError } = await supabase.functions.invoke('database-functions', {
          method: 'POST',
          body: {}
        });
        
        if (dbFunctionsError) {
          throw dbFunctionsError;
        }
        
        console.log("Database functions initialized:", dbFunctionsResult);
        toast.success("Database functions created", {
          description: "Required database functions have been created successfully",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error initializing database functions:", error);
        toast.error("Failed to initialize database functions", {
          description: error instanceof Error ? error.message : "Check the console for more details",
          id: initialToast,
          duration: 5000,
        });
        return false;
      }
    }
    
    // Now create the tables using the initialize-database function
    console.log("Initializing database tables...");
    
    try {
      const { data: initResult, error: initError } = await supabase.functions.invoke('initialize-database', {
        method: 'POST',
        body: {}
      });
      
      if (initError) {
        throw initError;
      }
      
      console.log("Database tables initialized:", initResult);
      toast.success("Database setup complete", {
        description: "All tables and functions created successfully",
        id: initialToast,
        duration: 4000,
      });
      return true;
    } catch (error) {
      console.error("Error initializing database:", error);
      toast.error("Failed to create database tables", {
        description: error instanceof Error ? error.message : "Check the console for more details",
        id: initialToast,
        duration: 5000,
      });
      return false;
    }
    
  } catch (error) {
    console.error("Error initializing database:", error);
    toast.error("Failed to initialize database connection", {
      description: error instanceof Error ? error.message : "Unknown error occurred",
      duration: 5000,
    });
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
    try {
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
      
      if (tableCheckError) throw tableCheckError;
      
      if (!tablesExist || 
          !tablesExist[0].devices_exist || 
          !tablesExist[0].telemetry_exist || 
          !tablesExist[0].apps_exist) {
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
      console.error("Error checking database tables:", error);
      // Tables or function don't exist
      return {
        devices: 0,
        telemetry_records: 0,
        apps: 0
      };
    }
  } catch (error) {
    console.error("Error getting database stats:", error);
    toast.error("Failed to fetch database statistics", {
      description: "Please try again later",
      duration: 3000,
    });
    return null;
  }
};

// Create a new execute_sql function to allow for safe SQL execution
export const executeSQL = async (sql: string): Promise<any> => {
  try {
    const { data, error } = await client.rpc('execute_sql', { sql });
    
    if (error) {
      console.error("Error executing SQL:", error);
      toast.error("SQL execution failed", {
        description: error.message,
        duration: 3000,
      });
      return { success: false, error };
    }
    
    toast.success("SQL executed successfully");
    return { success: true, data };
  } catch (error) {
    console.error("Error executing SQL:", error);
    toast.error("SQL execution failed", {
      description: error instanceof Error ? error.message : "Unknown error occurred",
      duration: 3000,
    });
    return { success: false, error };
  }
};
