
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Database, Loader2, Copy } from "lucide-react";
import { initializeDatabaseConnection, getDatabaseStats } from "@/services/databaseService";
import { Textarea } from "@/components/ui/textarea";

const SettingsPage = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<{
    devices: number;
    telemetry_records: number;
    apps: number;
  } | null>(null);
  
  useEffect(() => {
    // Page title
    document.title = "Settings - Device Telemetry";
    
    // Check database status on load
    checkDatabaseStatus();
  }, []);
  
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved", {
      description: "Your general settings have been updated",
    });
  };
  
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Notification settings saved", {
      description: "Your notification preferences have been updated",
    });
  };

  // Get current domain for API endpoint display
  const currentDomain = window.location.origin;
  const apiEndpoint = `${currentDomain}/api/telemetry`;
  
  // Function to check database status
  const checkDatabaseStatus = async () => {
    setIsRefreshing(true);
    toast.loading("Refreshing database statistics...", { duration: 3000 });
    try {
      const stats = await getDatabaseStats();
      if (stats) {
        setDatabaseStatus(stats);
        toast.success("Database statistics refreshed", { duration: 2000 });
      } else {
        toast.error("Failed to refresh database statistics", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error checking database status:", error);
      toast.error("Failed to refresh database statistics", {
        description: "An unexpected error occurred",
        duration: 3000
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to initialize database connection
  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeDatabaseConnection();
      // Success/error toasts are now handled in the service function
      if (result) {
        // If successful, refresh the database stats
        await checkDatabaseStatus();
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      toast.error("Database initialization failed", {
        description: "An unexpected error occurred during initialization",
        duration: 4000
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Generate SQL for database setup
  const getSetupSQL = () => {
    return `-- Create the execute_sql function for safe SQL execution
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the process_telemetry_data function
CREATE OR REPLACE FUNCTION process_telemetry_data()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  android_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  manufacturer TEXT,
  model TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create telemetry_history table
CREATE TABLE IF NOT EXISTS public.telemetry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  telemetry_data JSONB NOT NULL
);

-- Create device_apps table
CREATE TABLE IF NOT EXISTS public.device_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id),
  app_package TEXT NOT NULL
);

-- Enable row level security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_apps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users" ON public.devices
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated users" ON public.telemetry_history
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated users" ON public.device_apps
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_apps;

-- Set replica identity to full for realtime updates
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.telemetry_history REPLICA IDENTITY FULL;
ALTER TABLE public.device_apps REPLICA IDENTITY FULL;`;
  };
  
  // Function to copy SQL to clipboard
  const copySQL = () => {
    navigator.clipboard.writeText(getSetupSQL());
    toast.success("SQL copied to clipboard", {
      description: "You can now paste it into Supabase SQL editor",
      duration: 3000
    });
  };
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="database" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general system settings for the telemetry monitoring tool.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input id="system-name" defaultValue="Device Telemetry Beacon" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="offline-threshold">Offline Threshold (minutes)</Label>
                  <Input 
                    id="offline-threshold" 
                    type="number" 
                    defaultValue="15" 
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time in minutes after which a device is marked as offline if no data is received.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention Period (days)</Label>
                  <Input 
                    id="data-retention" 
                    type="number" 
                    defaultValue="30" 
                    min="1"
                    max="365"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days to retain historical telemetry data.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="auto-refresh" defaultChecked />
                  <Label htmlFor="auto-refresh">Enable auto-refresh (1 minute)</Label>
                </div>
                
                <Button type="submit">Save Settings</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure when and how you receive alerts about devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-offline" defaultChecked />
                    <Label htmlFor="notify-offline">Device offline notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-battery" defaultChecked />
                    <Label htmlFor="notify-battery">Low battery notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-security" />
                    <Label htmlFor="notify-security">Security issue notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-new-device" defaultChecked />
                    <Label htmlFor="notify-new-device">New device detected</Label>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Label htmlFor="email-notifications" className="mb-2 block">Email Notifications</Label>
                  <Input id="email-notifications" type="email" placeholder="admin@example.com" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to disable email notifications.
                  </p>
                </div>
                
                <Button type="submit">Save Notification Settings</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>
                Manage the database connection for telemetry data storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Database Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-secondary p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Devices</p>
                      <p className="text-2xl font-bold">
                        {isRefreshing ? 
                          <span className="flex items-center">
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Loading...
                          </span> : 
                          databaseStatus?.devices ?? '0'
                        }
                      </p>
                    </div>
                    <div className="bg-secondary p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Telemetry Records</p>
                      <p className="text-2xl font-bold">
                        {isRefreshing ? 
                          <span className="flex items-center">
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Loading...
                          </span> : 
                          databaseStatus?.telemetry_records ?? '0'
                        }
                      </p>
                    </div>
                    <div className="bg-secondary p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">App Records</p>
                      <p className="text-2xl font-bold">
                        {isRefreshing ? 
                          <span className="flex items-center">
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Loading...
                          </span> : 
                          databaseStatus?.apps ?? '0'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={checkDatabaseStatus}
                      disabled={isRefreshing}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Database Operations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Initialize or verify the database tables and connections.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleInitializeDatabase} 
                      disabled={isInitializing}
                      className="flex items-center gap-2"
                    >
                      {isInitializing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Setting up database...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          Initialize/Verify Database
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* New section for manual SQL setup */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Manual Database Setup</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If automatic initialization fails, you can manually set up the required tables and functions.
                    Copy the SQL below and run it in the Supabase SQL Editor.
                  </p>
                  
                  <div className="mt-4 mb-2">
                    <Button 
                      variant="outline" 
                      onClick={copySQL}
                      className="flex items-center gap-2 mb-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy SQL to Clipboard
                    </Button>
                    
                    <div className="relative">
                      <Textarea 
                        value={getSetupSQL()}
                        className="font-mono text-xs h-80 overflow-auto bg-secondary"
                        readOnly
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      After running the SQL, return here and click "Refresh" to verify the tables were created successfully.
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Database Initialization Process</h3>
                  <p className="text-sm text-muted-foreground">
                    When you click "Initialize/Verify Database", the following steps are performed:
                  </p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-2">
                    <li>Create database functions for SQL execution and data processing</li>
                    <li>Create required tables if they don't exist (devices, telemetry_history, device_apps)</li>
                    <li>Set up triggers for automatic data processing</li>
                    <li>Enable realtime updates for live data monitoring</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    This process is safe to run multiple times and will only create tables and functions if they don't exist.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">About Database Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    All device telemetry data is automatically stored in the database. The database structure includes:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li><strong>devices</strong> - Basic device information (IDs, names, models)</li>
                    <li><strong>telemetry_history</strong> - Complete telemetry data history</li>
                    <li><strong>device_apps</strong> - List of applications installed on each device</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    All data is automatically persisted and retrievable for historical analysis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Configure the API endpoint and authentication for receiving telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-endpoint" className="mb-2 block">API Endpoint</Label>
                  <code className="text-sm bg-secondary p-3 rounded block">
                    POST {apiEndpoint}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send device telemetry data to this endpoint.
                  </p>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input id="api-key" value="telm_sk_1234567890abcdef" readOnly className="font-mono text-sm" />
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText("telm_sk_1234567890abcdef");
                      toast("API key copied to clipboard");
                    }}>
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this API key in the Authorization header: <code>Authorization: Bearer telm_sk_1234567890abcdef</code>
                  </p>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-2">Headers</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Required headers for your API request:
                  </p>
                  <pre className="text-xs bg-secondary p-3 rounded block overflow-x-auto">
{`Content-Type: application/json
Authorization: Bearer telm_sk_1234567890abcdef`}
                  </pre>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-2">Sample Request</h3>
                  <pre className="text-xs bg-secondary p-3 rounded block overflow-x-auto">
{`curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer telm_sk_1234567890abcdef" \\
  -d '{
  "device_info": {
    "device_name": "Samsung Galaxy A13",
    "manufacturer": "samsung",
    "model": "SM-A135F",
    "android_id": "e03c18c36f70be06"
  },
  "system_info": {
    "android_version": "13",
    "sdk_int": 33,
    "uptime_millis": 86400000
  },
  "battery_info": {
    "battery_level": 85,
    "battery_status": "Charging"
  },
  "network_info": {
    "ip_address": "192.168.1.155",
    "network_interface": "WiFi"
  },
  "android_id": "e03c18c36f70be06"
}'`}
                  </pre>
                </div>
                
                <div className="pt-4 bg-amber-50 p-3 rounded-md border border-amber-200">
                  <h3 className="font-medium mb-2 text-amber-800">⚠️ Common JSON Errors</h3>
                  <p className="text-xs text-amber-700 mb-2">
                    Make sure your JSON is properly formatted. Common errors include:
                  </p>
                  <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                    <li>Extra curly braces (e.g., <code>{"{{"}</code> instead of <code>{"{"}</code>)</li>
                    <li>Missing or extra commas</li>
                    <li>Unquoted property names</li>
                    <li>Single quotes instead of double quotes (JSON requires double quotes for keys and string values)</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Response Format</h3>
                  <pre className="text-xs bg-secondary p-3 rounded block overflow-x-auto">
{`{
  "success": true,
  "message": "Telemetry data received",
  "device_id": "e03c18c36f70be06",
  "timestamp": 1746723241879
}`}
                  </pre>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Required Fields</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    At minimum, the request must include either:
                  </p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    <li><code>android_id</code> as a root property, or</li>
                    <li><code>device_info.android_id</code> inside the device_info object</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Common Errors</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>401 Unauthorized</strong>: Check your API key is correct
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>400 Bad Request</strong>: Check your JSON format and required fields
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>405 Method Not Allowed</strong>: Make sure you're using POST
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Testing Your API</h3>
                  <p className="text-xs text-muted-foreground">
                    You can send a test request to your API endpoint to verify it's working correctly.
                    Make sure to include the proper headers and at least the required fields in your JSON.
                  </p>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(`curl -X POST ${apiEndpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer telm_sk_1234567890abcdef" \\\n  -d '{\n  "device_info": {\n    "device_name": "Test Device",\n    "android_id": "test123456789"\n  }}'`);
                        toast("Minimal test curl command copied to clipboard");
                      }}
                    >
                      Copy Test Command
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default SettingsPage;
