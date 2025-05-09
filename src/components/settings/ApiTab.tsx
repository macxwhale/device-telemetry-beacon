
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
    "device_name": "stvs9",
    "manufacturer": "Amlogic",
    "brand": "Amlogic",
    "model": "Quad-Core Enjoy TV Box",
    "product": "stvs9",
    "android_id": "fef5ddc6fbe95c24",
    "is_emulator": false
  },
  "system_info": {
    "android_version": "7.1.2",
    "sdk_int": 25,
    "base_version": 1,
    "fingerprint": "Amlogic/stvs9/stvs9:7.1.2/V002S901_20190409/20190409:userdebug/test-keys",
    "build_number": "V002S901_20190409",
    "kernel_version": "Linux version 3.14.29 (jenkins@ubt144c) (gcc version 4.9.2 20140904 (prerelease) (crosstool-NG linaro-1.13.1-4.9-2014.09 - Linaro GCC 4.9-2014.09) ) #7 SMP PREEMPT Tue Apr 9 18:26:48 CST 2019",
    "bootloader": "unknown",
    "build_tags": "test-keys",
    "build_type": "userdebug",
    "board": "stvs9",
    "hardware": "amlogic",
    "host": "ubt144c",
    "user": "jenkins",
    "uptime_millis": 3027139,
    "boot_time": 1746798704974,
    "cpu_cores": 4,
    "language": "en",
    "timezone": "GMT"
  },
  "battery_info": {
    "battery_level": 0,
    "battery_status": "Unknown"
  },
  "network_info": {
    "wifi_ip": "192.168.72.231",
    "ethernet_ip": "192.168.100.30",
    "carrier": "",
    "wifi_ssid": "\\"Connectile Dysfunction\\""
  },
  "display_info": {
    "screen_resolution": "1920x1008",
    "screen_orientation": "Landscape"
  },
  "security_info": {
    "is_rooted": true
  },
  "app_info": {
    "installed_apps": [
      "com.android.cts.priv.ctsshim",
      "com.wavetec.packagelistener",
      "com.android.providers.telephony",
      "com.android.providers.calendar",
      "com.android.tv.settings",
      "com.android.providers.media",
      "com.android.wallpapercropper",
      "com.wavetec.kiosk",
      "com.android.launcher",
      "com.android.documentsui",
      "com.android.externalstorage",
      "com.android.htmlviewer",
      "com.android.providers.downloads",
      "com.geniatech.preloadinstall",
      "com.geniatech.glauncher",
      "com.droidlogic.mediacenter",
      "com.droidlogic",
      "com.droidlogic.tv.settings",
      "com.android.defcontainer",
      "com.bunisystems.com.mon",
      "com.android.pacprocessor",
      "com.android.certinstaller",
      "android",
      "com.android.camera2",
      "com.geniatech.upgrade",
      "com.android.backupconfirm",
      "com.droidlogic.FileBrower",
      "com.android.provision",
      "com.android.statementservice",
      "com.bixolon.sample",
      "com.android.providers.settings",
      "berserker.android.apps.sshdroid",
      "com.android.sharedstoragebackup",
      "com.android.printspooler",
      "com.android.dreams.basic",
      "com.android.webview",
      "com.android.inputdevices",
      "com.wavetec.appinstaller",
      "com.android.musicfx",
      "com.droidlogic.SubTitleService",
      "android.ext.shared",
      "com.android.onetimeinitializer",
      "com.droidlogic.dig",
      "com.android.keychain",
      "com.android.chrome",
      "com.android.gallery3d",
      "com.google.android.gsf",
      "android.ext.services",
      "com.droidlogic.videoplayer",
      "mobi.infolife.appbackup",
      "com.android.packageinstaller",
      "org.xbmc.kodi",
      "com.wavetec.mouseutility",
      "com.android.proxyhandler",
      "com.android.inputmethod.latin",
      "com.android.managedprovisioning",
      "com.android.dreams.phototable",
      "com.droidlogic.miracast",
      "com.google.android.gsf.login",
      "com.android.smspush",
      "com.geniatech.autotest",
      "com.android.settings",
      "com.wavetec.kioskrestarter",
      "com.android.cts.ctsshim",
      "com.google.android.youtube.tv",
      "com.droidlogic.imageplayer",
      "com.android.vpndialogs",
      "com.android.music",
      "com.android.shell",
      "com.android.wallpaperbackup",
      "com.android.providers.userdictionary",
      "com.android.location.fused",
      "com.android.deskclock",
      "com.android.systemui",
      "com.droidlogic.appinstall",
      "com.geniatech.oobe",
      "com.android.bluetooth",
      "com.android.providers.contacts",
      "com.android.captiveportallogin"
    ]
  },
  "timestamp": 1746801732150,
  "device_id": "fef5ddc6fbe95c24",
  "os_type": "Android 6.0-7.1"
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
