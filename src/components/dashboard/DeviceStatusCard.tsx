
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Battery, SignalHigh, SignalLow, Wifi, Smartphone, Globe, Monitor, Terminal } from "lucide-react";

// Property list component for device info
const DeviceInfo: FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <div className="flex items-center justify-between">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-xs font-medium flex items-center gap-1">{children}</div>
  </div>
);

// Helper functions for device icons
const getDeviceIcons = (device: DeviceStatus) => {
  // Network icon selection based on network type
  const getNetworkIcon = () => {
    const type = device.network_type?.toLowerCase() || '';
    if (type.includes('wifi')) return <Wifi className="h-3 w-3" />;
    if (type.includes('mobile')) return <Smartphone className="h-3 w-3" />;
    return <Globe className="h-3 w-3" />;
  };

  // OS icon selection based on OS version
  const getOsIcon = () => {
    const os = device.os_version?.toLowerCase() || '';
    if (os.includes('windows')) return <Monitor className="h-3 w-3" />;
    if (os.includes('linux')) return <Terminal className="h-3 w-3" />;
    return <Smartphone className="h-3 w-3" />; // Default for Android
  };
  
  return { getNetworkIcon, getOsIcon };
};

export const DeviceStatusCard: FC<{device: DeviceStatus}> = ({ device }) => {
  const { getNetworkIcon, getOsIcon } = getDeviceIcons(device);

  return (
    <Link to={`/devices/${device.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">{device.name}</CardTitle>
            <div className={`h-2 w-2 rounded-full ${device.isOnline ? "bg-status-online" : "bg-status-offline"} animate-pulse-slow`}></div>
          </div>
          <p className="text-xs text-muted-foreground">{device.model} - {device.manufacturer}</p>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <DeviceInfo label="Status">
            {device.isOnline ? (
              <span className="text-status-online flex items-center gap-1">
                <SignalHigh className="h-3 w-3" />Online
              </span>
            ) : (
              <span className="text-status-offline flex items-center gap-1">
                <SignalLow className="h-3 w-3" />Offline
              </span>
            )}
          </DeviceInfo>
          <DeviceInfo label="Last Seen">{formatDistanceToNow(device.last_seen, { addSuffix: true })}</DeviceInfo>
          <DeviceInfo label="Battery"><Battery className="h-3 w-3" />{device.battery_level}%</DeviceInfo>
          <DeviceInfo label="Network">{getNetworkIcon()}{device.network_type || "Unknown"}</DeviceInfo>
          <DeviceInfo label="OS">{getOsIcon()}{device.os_version}</DeviceInfo>
        </CardContent>
      </Card>
    </Link>
  );
};
