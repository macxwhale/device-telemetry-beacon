
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { initializeDatabaseConnection } from "@/services/databaseService";
import { Database, ServerCog } from "lucide-react";

const DatabaseOperations = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeDatabaseConnection();
      if (result) {
        toast.success("Database initialized successfully", {
          description: "All required tables and functions have been created"
        });
      }
    } catch (error) {
      toast.error("Failed to initialize database", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRefreshStats = () => {
    setIsRefreshing(true);
    // Simulate refreshing stats by forcing a reload of the page
    window.location.reload();
  };

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-medium mb-2">Database Operations</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Initialize or verify the database structure and manage database connections.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={handleInitializeDatabase}
          disabled={isInitializing}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          {isInitializing ? "Initializing..." : "Initialize/Verify Database"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleRefreshStats}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <ServerCog className="h-4 w-4" />
          {isRefreshing ? "Refreshing..." : "Refresh Stats"}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Note: Initialization creates all required tables, functions, and triggers if they don't exist.
      </p>
    </div>
  );
};

export default DatabaseOperations;
