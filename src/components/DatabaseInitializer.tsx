
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Database, ArrowRightLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { initializeDatabaseConnection, migrateMemoryDataToDatabase } from "@/services/databaseService";
import { getAllDevicesFromApi } from "@/api/index";

export const DatabaseInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [migrated, setMigrated] = useState(false);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeDatabaseConnection();
      if (success) {
        toast({
          title: "Database Initialized",
          description: "The database connection has been successfully initialized.",
          variant: "default",
        });
        setInitialized(true);
      } else {
        toast({
          title: "Initialization Failed",
          description: "Failed to initialize the database. Check the console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
      toast({
        title: "Initialization Error",
        description: "An unexpected error occurred. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      // Get devices from in-memory database
      const devices = getAllDevicesFromApi();
      console.log(`Migrating ${devices.length} devices from memory to database...`);
      
      if (devices.length === 0) {
        toast({
          title: "No Data to Migrate",
          description: "There are no devices in the in-memory database. Send test data first.",
          variant: "default",
        });
        setIsMigrating(false);
        return;
      }

      const success = await migrateMemoryDataToDatabase(devices);
      if (success) {
        toast({
          title: "Data Migration Complete",
          description: `Successfully migrated ${devices.length} devices to the database.`,
          variant: "default",
        });
        setMigrated(true);
      } else {
        toast({
          title: "Migration Failed",
          description: "Failed to migrate data to the database. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to migrate data:", error);
      toast({
        title: "Migration Error",
        description: "An unexpected error occurred. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Operations</CardTitle>
        <CardDescription>
          Initialize the database and migrate in-memory data to permanent storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Step 1: Initialize Database</h3>
          <p className="text-sm text-muted-foreground">
            Set up the database structure and required functions
          </p>
          <Button
            onClick={handleInitialize}
            disabled={isInitializing || initialized}
            className="w-full"
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : initialized ? (
              <>
                <Database className="mr-2 h-4 w-4" />
                Database Initialized
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Initialize Database
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Step 2: Migrate In-Memory Data</h3>
          <p className="text-sm text-muted-foreground">
            Transfer device data from memory to the database
          </p>
          <Button
            onClick={handleMigrate}
            disabled={isMigrating || !initialized || migrated}
            className="w-full"
          >
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : migrated ? (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Data Migrated
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Migrate Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          {initialized
            ? migrated
              ? "Database initialized and data migration complete."
              : "Database initialized. Ready to migrate data."
            : "Please initialize the database first."}
        </p>
      </CardFooter>
    </Card>
  );
};
