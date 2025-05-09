
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Create a generic client type that allows us to access any table
const client = supabase as any;

// Initialize the database connection and ensure tables exist
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Initializing database connection...");
    const initialToast = toast.loading("Checking database connection...", {
      duration: 6000,
    });
    
    try {
      // Check if tables exist
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
      
      if (tableCheckError) {
        // If we get an error here, the execute_sql function likely doesn't exist yet
        console.error("Error checking database tables:", tableCheckError);
        toast.error("Database not properly configured", {
          description: "Please run the SQL setup script from the documentation",
          id: initialToast,
          duration: 8000,
        });
        return false;
      }
      
      if (!tablesExist || 
          !tablesExist[0]?.devices_exist || 
          !tablesExist[0]?.telemetry_exist || 
          !tablesExist[0]?.apps_exist) {
        console.log("Database tables don't exist yet");
        toast.error("Database tables not found", {
          description: "Please run the SQL setup script from the documentation",
          id: initialToast,
          duration: 8000,
        });
        return false;
      }
      
      // Tables exist, check if realtime is enabled
      try {
        // Try to execute a simple query to check if the function exists
        const { error: fnCheckError } = await client.rpc('execute_sql', {
          sql: `SELECT 1`
        });
        
        if (fnCheckError) {
          console.error("Error with execute_sql function:", fnCheckError);
        } else {
          console.log("Database connection verified");
          toast.success("Database connection verified", {
            description: "All required tables are properly configured",
            id: initialToast,
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error checking database functions:", error);
        // Non-critical error, continue with warning
        toast.warning("Database connected but functions may not be fully configured", {
          description: "Some features may be limited",
          id: initialToast,
          duration: 5000,
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error checking database tables:", error);
      toast.error("Failed to check database tables", {
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

// Execute SQL function to allow for safe SQL execution
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
