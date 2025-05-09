
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const SettingsPage = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  
  useEffect(() => {
    // Page title
    document.title = "Settings - Device Telemetry";
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
  
  // Generate SQL for database setup
  const getSetupSQL = () => {
    return `-- Create the execute_sql function for safe SQL execution
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enums for common statuses
CREATE TYPE public.battery_status AS ENUM ('Charging', 'Discharging', 'Full', 'Not Charging', 'Unknown');
CREATE TYPE public.network_type AS ENUM ('WiFi', 'Mobile', 'Ethernet', 'None', 'Unknown');

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

-- Create device_telemetry table for structured data
CREATE TABLE IF NOT EXISTS public.device_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Device info
  device_name TEXT,
  manufacturer TEXT,
  brand TEXT,
  model TEXT,
  product TEXT,
  android_id TEXT,
  imei TEXT,
  is_emulator BOOLEAN,
  
  -- System info
  android_version TEXT,
  sdk_int INTEGER,
  base_version INTEGER,
  fingerprint TEXT,
  build_number TEXT,
  kernel_version TEXT,
  bootloader TEXT,
  build_tags TEXT,
  build_type TEXT,
  board TEXT,
  hardware TEXT,
  host TEXT,
  user_name TEXT,
  uptime_millis BIGINT,
  boot_time BIGINT,
  cpu_cores INTEGER,
  language TEXT,
  timezone TEXT,
  
  -- Battery info
  battery_level INTEGER,
  battery_status battery_status,
  
  -- Network info
  ip_address TEXT,
  network_interface network_type,
  carrier TEXT,
  wifi_ssid TEXT,
  
  -- Display info
  screen_resolution TEXT,
  screen_orientation TEXT,
  
  -- Security info
  is_rooted BOOLEAN,
  
  -- OS info
  os_type TEXT
);

-- Create telemetry_history table for raw JSON data
CREATE TABLE IF NOT EXISTS public.telemetry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  telemetry_data JSONB NOT NULL
);

-- Create device_apps table
CREATE TABLE IF NOT EXISTS public.device_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  app_package TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(device_id, app_package)
);

-- Create or replace the process_telemetry_data function
CREATE OR REPLACE FUNCTION process_telemetry_data()
RETURNS TRIGGER AS $$
DECLARE
  device_id_var UUID;
  device_info JSONB;
  system_info JSONB;
  battery_info JSONB;
  network_info JSONB;
  display_info JSONB;
  security_info JSONB;
  app_info JSONB;
  ip_addr TEXT;
  network_type_var network_type;
  battery_status_var battery_status;
  app_list TEXT[];
BEGIN
  -- Extract sections from telemetry data
  device_info := NEW.telemetry_data->'device_info';
  system_info := NEW.telemetry_data->'system_info';
  battery_info := NEW.telemetry_data->'battery_info';
  network_info := NEW.telemetry_data->'network_info';
  display_info := NEW.telemetry_data->'display_info';
  security_info := NEW.telemetry_data->'security_info';
  app_info := NEW.telemetry_data->'app_info';
  
  -- Get Android ID from telemetry data
  -- First try getting it from device_info
  IF device_info IS NOT NULL AND device_info->>'android_id' IS NOT NULL THEN
    -- First ensure device exists in devices table
    INSERT INTO public.devices (
      android_id, 
      device_name, 
      manufacturer, 
      model, 
      last_seen
    )
    VALUES (
      device_info->>'android_id',
      device_info->>'device_name',
      device_info->>'manufacturer',
      device_info->>'model',
      NEW.timestamp
    )
    ON CONFLICT (android_id) DO UPDATE
    SET 
      device_name = COALESCE(EXCLUDED.device_name, devices.device_name),
      manufacturer = COALESCE(EXCLUDED.manufacturer, devices.manufacturer),
      model = COALESCE(EXCLUDED.model, devices.model),
      last_seen = EXCLUDED.last_seen
    RETURNING id INTO device_id_var;
  ELSE
    -- Try getting android_id from root of the data
    INSERT INTO public.devices (
      android_id, 
      device_name, 
      manufacturer, 
      model, 
      last_seen
    )
    VALUES (
      NEW.telemetry_data->>'android_id',
      device_info->>'device_name',
      device_info->>'manufacturer',
      device_info->>'model',
      NEW.timestamp
    )
    ON CONFLICT (android_id) DO UPDATE
    SET 
      last_seen = EXCLUDED.last_seen
    RETURNING id INTO device_id_var;
  END IF;
  
  -- Determine IP address from different possible sources
  ip_addr := 
    COALESCE(
      network_info->>'ethernet_ip', 
      network_info->>'wifi_ip', 
      network_info->>'mobile_ip', 
      network_info->>'ip_address',
      '0.0.0.0'
    );
  
  -- Determine network type
  IF network_info->>'network_interface' = 'WiFi' OR network_info->>'wifi_ip' IS NOT NULL THEN
    network_type_var := 'WiFi';
  ELSIF network_info->>'network_interface' = 'Mobile' OR network_info->>'mobile_ip' IS NOT NULL THEN
    network_type_var := 'Mobile';
  ELSIF network_info->>'network_interface' = 'Ethernet' OR network_info->>'ethernet_ip' IS NOT NULL THEN
    network_type_var := 'Ethernet';
  ELSIF network_info->>'network_interface' = 'None' THEN
    network_type_var := 'None';
  ELSE
    network_type_var := 'Unknown';
  END IF;
  
  -- Determine battery status
  IF battery_info->>'battery_status' = 'Charging' THEN
    battery_status_var := 'Charging';
  ELSIF battery_info->>'battery_status' = 'Discharging' THEN
    battery_status_var := 'Discharging';
  ELSIF battery_info->>'battery_status' = 'Full' THEN
    battery_status_var := 'Full';
  ELSIF battery_info->>'battery_status' = 'Not Charging' THEN
    battery_status_var := 'Not Charging';
  ELSE
    battery_status_var := 'Unknown';
  END IF;
  
  -- Insert into device_telemetry table
  INSERT INTO public.device_telemetry (
    device_id,
    timestamp,
    device_name,
    manufacturer,
    brand,
    model,
    product,
    android_id,
    imei,
    is_emulator,
    android_version,
    sdk_int,
    base_version,
    fingerprint,
    build_number,
    kernel_version,
    bootloader,
    build_tags,
    build_type,
    board,
    hardware,
    host,
    user_name,
    uptime_millis,
    boot_time,
    cpu_cores,
    language,
    timezone,
    battery_level,
    battery_status,
    ip_address,
    network_interface,
    carrier,
    wifi_ssid,
    screen_resolution,
    screen_orientation,
    is_rooted,
    os_type
  ) VALUES (
    device_id_var,
    NEW.timestamp,
    device_info->>'device_name',
    device_info->>'manufacturer',
    device_info->>'brand',
    device_info->>'model',
    device_info->>'product',
    device_info->>'android_id',
    device_info->>'imei',
    (device_info->>'is_emulator')::boolean,
    system_info->>'android_version',
    (system_info->>'sdk_int')::integer,
    (system_info->>'base_version')::integer,
    system_info->>'fingerprint',
    system_info->>'build_number',
    system_info->>'kernel_version',
    system_info->>'bootloader',
    system_info->>'build_tags',
    system_info->>'build_type',
    system_info->>'board',
    system_info->>'hardware',
    system_info->>'host',
    system_info->>'user',
    (system_info->>'uptime_millis')::bigint,
    (system_info->>'boot_time')::bigint,
    (system_info->>'cpu_cores')::integer,
    system_info->>'language',
    system_info->>'timezone',
    (battery_info->>'battery_level')::integer,
    battery_status_var,
    ip_addr,
    network_type_var,
    network_info->>'carrier',
    network_info->>'wifi_ssid',
    display_info->>'screen_resolution',
    display_info->>'screen_orientation',
    (security_info->>'is_rooted')::boolean,
    NEW.telemetry_data->>'os_type'
  );
  
  -- Process installed apps if present
  IF app_info IS NOT NULL AND app_info->'installed_apps' IS NOT NULL THEN
    app_list := ARRAY(SELECT jsonb_array_elements_text(app_info->'installed_apps'));
    
    IF array_length(app_list, 1) > 0 THEN
      INSERT INTO public.device_apps (device_id, app_package)
      SELECT 
        device_id_var,
        app_name
      FROM unnest(app_list) AS app_name
      ON CONFLICT (device_id, app_package) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON public.device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.device_telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_device_id ON public.telemetry_history(device_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON public.telemetry_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_apps_device_id ON public.device_apps(device_id);

-- Enable row level security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Allow full access to authenticated users" ON public.device_telemetry
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_apps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_telemetry;

-- Set replica identity to full for realtime updates
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.telemetry_history REPLICA IDENTITY FULL;
ALTER TABLE public.device_apps REPLICA IDENTITY FULL;
ALTER TABLE public.device_telemetry REPLICA IDENTITY FULL;`;
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
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Telemetry Records</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">App Records</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Database Operations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Initialize or verify the database tables and connections.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => toast.info("This feature is currently disabled.")} 
                      disabled={isInitializing}
                    >
                      Initialize/Verify Database
                    </Button>
                  </div>
                </div>

                {/* Manual Database Setup */}
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
