
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SettingsPage = () => {
  useEffect(() => {
    // Page title
    document.title = "Settings - Device Telemetry";
  }, []);
  
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated",
    });
  };
  
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated",
    });
  };

  // Get current domain for API endpoint display
  const currentDomain = window.location.origin;
  const apiEndpoint = `${currentDomain}/api/telemetry`;
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                      toast({
                        title: "Copied to clipboard",
                        description: "API key copied to clipboard",
                      });
                    }}>
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this API key in the Authorization header: <code>Authorization: Bearer telm_sk_1234567890abcdef</code>
                  </p>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-2">Content-Type Header</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Make sure to include the Content-Type header in your request:
                  </p>
                  <code className="text-xs bg-secondary p-3 rounded block">
                    Content-Type: application/json
                  </code>
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
    "brand": "samsung",
    "model": "SM-A135F",
    "product": "a13nsxx",
    "android_id": "e03c18c36f70be06"
  },
  "system_info": {
    "android_version": "13",
    "sdk_int": 33,
    "build_number": "TP1A.220624.014.A135FXXU3CWD1",
    "bootloader": "A135FXXU3CWD1",
    "board": "exynos850",
    "hardware": "exynos850",
    "cpu_cores": 8,
    "language": "en_US",
    "timezone": "Europe/London",
    "uptime_millis": 86400000
  },
  "battery_info": {
    "battery_level": 85,
    "battery_status": "Charging"
  },
  "display_info": {
    "screen_resolution": "1080x2408",
    "screen_orientation": "portrait"
  },
  "network_info": {
    "ip_address": "192.168.1.155",
    "network_interface": "WiFi",
    "carrier": "Vodafone",
    "wifi_ssid": "Home-WiFi"
  },
  "security_info": {
    "is_rooted": false
  }
}'`}
                  </pre>
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
