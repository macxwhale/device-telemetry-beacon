
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TelemetryData } from "@/types/telemetry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeviceDetailsProps {
  telemetry: TelemetryData;
}

export const DeviceDetails: FC<DeviceDetailsProps> = ({ telemetry }) => {
  if (!telemetry) {
    return <p>No detailed telemetry data available for this device.</p>;
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Device Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="device" className="w-full">
          <TabsList className="w-full grid grid-cols-4 gap-2 mb-4">
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          {/* Device Info Tab */}
          <TabsContent value="device">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Device Name</p>
                <p className="text-sm font-medium">{telemetry.device_info.device_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer</p>
                <p className="text-sm font-medium">{telemetry.device_info.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="text-sm font-medium">{telemetry.device_info.brand}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-sm font-medium">{telemetry.device_info.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="text-sm font-medium">{telemetry.device_info.product}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Android ID</p>
                <p className="text-sm font-medium">{telemetry.device_info.android_id}</p>
              </div>
              {telemetry.device_info.imei && (
                <div>
                  <p className="text-sm text-muted-foreground">IMEI</p>
                  <p className="text-sm font-medium">{telemetry.device_info.imei}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Is Emulator</p>
                <p className="text-sm font-medium">{telemetry.device_info.is_emulator ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Screen Resolution</p>
                <p className="text-sm font-medium">{telemetry.display_info.screen_resolution}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orientation</p>
                <p className="text-sm font-medium">{telemetry.display_info.screen_orientation}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Battery Level</p>
                <p className="text-sm font-medium">{telemetry.battery_info.battery_level}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Battery Status</p>
                <p className="text-sm font-medium">{telemetry.battery_info.battery_status}</p>
              </div>
            </div>
          </TabsContent>
          
          {/* System Info Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Android Version</p>
                <p className="text-sm font-medium">{telemetry.system_info.android_version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SDK</p>
                <p className="text-sm font-medium">{telemetry.system_info.sdk_int}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Build Number</p>
                <p className="text-sm font-medium">{telemetry.system_info.build_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bootloader</p>
                <p className="text-sm font-medium">{telemetry.system_info.bootloader}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Board</p>
                <p className="text-sm font-medium">{telemetry.system_info.board}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hardware</p>
                <p className="text-sm font-medium">{telemetry.system_info.hardware}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPU Cores</p>
                <p className="text-sm font-medium">{telemetry.system_info.cpu_cores}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="text-sm font-medium">{telemetry.system_info.language}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timezone</p>
                <p className="text-sm font-medium">{telemetry.system_info.timezone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-sm font-medium">
                  {Math.floor(telemetry.system_info.uptime_millis / (1000 * 60 * 60))} hours
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Fingerprint</p>
                <p className="text-sm font-medium break-all">{telemetry.system_info.fingerprint}</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Network Info Tab */}
          <TabsContent value="network">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {telemetry.network_info.wifi_ip && (
                <div>
                  <p className="text-sm text-muted-foreground">WiFi IP</p>
                  <p className="text-sm font-medium">{telemetry.network_info.wifi_ip}</p>
                </div>
              )}
              {telemetry.network_info.ethernet_ip && (
                <div>
                  <p className="text-sm text-muted-foreground">Ethernet IP</p>
                  <p className="text-sm font-medium">{telemetry.network_info.ethernet_ip}</p>
                </div>
              )}
              {telemetry.network_info.mobile_ip && (
                <div>
                  <p className="text-sm text-muted-foreground">Mobile IP</p>
                  <p className="text-sm font-medium">{telemetry.network_info.mobile_ip}</p>
                </div>
              )}
              {telemetry.network_info.ip_address && !telemetry.network_info.wifi_ip && !telemetry.network_info.mobile_ip && !telemetry.network_info.ethernet_ip && (
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="text-sm font-medium">{telemetry.network_info.ip_address}</p>
                </div>
              )}
              {telemetry.network_info.network_interface && (
                <div>
                  <p className="text-sm text-muted-foreground">Network Interface</p>
                  <p className="text-sm font-medium">{telemetry.network_info.network_interface}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="text-sm font-medium">{telemetry.network_info.carrier || "Not available"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WiFi SSID</p>
                <p className="text-sm font-medium">{telemetry.network_info.wifi_ssid}</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Security Info Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Is Rooted</p>
                <p className="text-sm font-medium">{telemetry.security_info.is_rooted ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OS Type</p>
                <p className="text-sm font-medium">{telemetry.os_type}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Installed Apps ({telemetry.app_info.installed_apps.length})</p>
              <div className="max-h-48 overflow-y-auto border p-3 rounded text-sm">
                {telemetry.app_info.installed_apps.slice(0, 20).map((app, index) => (
                  <div key={index} className="mb-1">{app}</div>
                ))}
                {telemetry.app_info.installed_apps.length > 20 && (
                  <div className="text-muted-foreground mt-2">
                    ... and {telemetry.app_info.installed_apps.length - 20} more apps
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
