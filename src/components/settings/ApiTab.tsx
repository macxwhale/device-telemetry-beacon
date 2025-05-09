
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ApiTab = () => {
  // Get current domain for API endpoint display
  const [apiEndpoint, setApiEndpoint] = useState('');
  
  useEffect(() => {
    const currentDomain = window.location.origin;
    setApiEndpoint(`${currentDomain}/api/telemetry`);
  }, []);
  
  return (
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
  );
};

export default ApiTab;
