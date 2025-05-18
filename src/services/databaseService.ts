
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Initialize the database connection and ensure tables exist
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Get the SQL setup script from the DatabaseSetupSQL component
    const { data, error } = await supabase.functions.invoke('initialize-database', {
      body: { action: 'initialize' },
    });
    
    if (error) {
      console.error("Error initializing database:", error);
      throw new Error(error.message);
    }
    
    toast.success("Database connection initialized", {
      description: "Successfully connected to the database",
      duration: 3000,
    });
    
    return true;
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
    // Query devices count
    const { count: devicesCount, error: devicesError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });
    
    if (devicesError) {
      console.error("Error fetching devices count:", devicesError);
      throw devicesError;
    }

    // Query telemetry records count
    const { count: telemetryCount, error: telemetryError } = await supabase
      .from('telemetry_history')
      .select('*', { count: 'exact', head: true });
    
    if (telemetryError) {
      console.error("Error fetching telemetry count:", telemetryError);
      throw telemetryError;
    }

    // Query app records count
    const { count: appsCount, error: appsError } = await supabase
      .from('device_apps')
      .select('*', { count: 'exact', head: true });
    
    if (appsError) {
      console.error("Error fetching apps count:", appsError);
      throw appsError;
    }

    return {
      devices: devicesCount || 0,
      telemetry_records: telemetryCount || 0,
      apps: appsCount || 0
    };
  } catch (error) {
    console.error("Error fetching database statistics:", error);
    toast.error("Failed to fetch database statistics", {
      description: error instanceof Error ? error.message : "Unknown error occurred",
      duration: 3000,
    });
    return null;
  }
};

// Execute SQL function to allow for safe SQL execution
export const executeSQL = async (sql: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: sql
    });
    
    if (error) {
      console.error("Error executing SQL:", error);
      throw error;
    }
    
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
