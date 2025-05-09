
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
    
    // First call the database-functions endpoint to set up the necessary functions
    console.log("Setting up database functions...");
    
    try {
      const { data: dbFunctionsResult, error: dbFunctionsError } = await supabase.functions.invoke('database-functions', {
        method: 'POST',
        body: {}
      });
      
      if (dbFunctionsError) {
        console.error("Error initializing database functions:", dbFunctionsError);
        toast.error("Failed to initialize database functions", {
          description: dbFunctionsError.message || "Check the console for more details",
          id: initialToast,
          duration: 5000,
        });
        return false;
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
    
    // Now create the tables using the initialize-database function
    console.log("Initializing database tables...");
    
    try {
      const { data: initResult, error: initError } = await supabase.functions.invoke('initialize-database', {
        method: 'POST',
        body: {}
      });
      
      if (initError) {
        console.error("Error initializing database:", initError);
        toast.error("Failed to create database tables", {
          description: initError.message || "Check the console for more details",
          id: initialToast,
          duration: 5000,
        });
        return false;
      }
      
      console.log("Database tables initialized:", initResult);
      toast.success("Database setup complete", {
        description: "All tables and functions created successfully",
        id: initialToast,
        duration: 4000,
      });
      
      // Check if realtime is enabled
      try {
        // Try to execute a simple query to check if the function exists
        const { error: fnCheckError } = await client.rpc('enable_realtime_tables');
        if (!fnCheckError) {
          console.log("Realtime tables enabled or verified");
          toast.success("Realtime tables enabled", {
            description: "You'll receive live telemetry updates as they come in",
            duration: 3000,
          });
        }
      } catch (realtimeError) {
        console.error("Error enabling realtime (non-critical):", realtimeError);
        // Non-critical error, don't show toast
      }
      
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
            SELECT 
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') as devices_exist,
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'telemetry_history') as telemetry_exist,
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_apps') as apps_exist
          `
        }
      );
      
      if (tableCheckError) throw tableCheckError;
      
      if (!tablesExist || 
          !tablesExist[0]?.devices_exist || 
          !tablesExist[0]?.telemetry_exist || 
          !tablesExist[0]?.apps_exist) {
        console.log("Database tables don't exist yet, returning zero counts");
        return {
          devices: 0,
          telemetry_records: 0,
          apps: 0
        };
      }
      
      // Use direct SQL query to count records since we don't have types yet
      const { data: stats, error: statsError } = await client.rpc('execute_sql', {
        sql: `
          SELECT 
            (SELECT COUNT(*) FROM devices) as device_count,
            (SELECT COUNT(*) FROM telemetry_history) as telemetry_count,
            (SELECT COUNT(*) FROM device_apps) as app_count
        `
      });
      
      if (statsError) throw statsError;
      
      const result = {
        devices: parseInt(stats[0]?.device_count || '0'),
        telemetry_records: parseInt(stats[0]?.telemetry_count || '0'),
        apps: parseInt(stats[0]?.app_count || '0')
      };
      
      console.log("Database stats:", result);
      
      return result;
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
