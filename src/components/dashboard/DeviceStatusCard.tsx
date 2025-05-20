
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Battery, SignalHigh, SignalLow, Wifi, Smartphone, Globe } from "lucide-react";

// Helper functions moved to utility components
const NetworkIcon: FC<{networkType: string}> = ({networkType}) => {
  const type = networkType?.toLowerCase() || '';
  if (type.includes('wifi')) return <Wifi className="h-3 w-3" />;
  if (type.includes('mobile')) return <Smartphone className="h-3 w-3" />;
  return <Globe className="h-3 w-3" />;
};

const StatusIndicator: FC<{isOnline: boolean}> = ({isOnline}) => (
  <div className="flex items-center gap-1">
    {isOnline ? (
      <>
        <SignalHigh className="h-3 w-3 text-status-online" />
        <span className="text-status-online">Online</span>
      </>
    ) : (
      <>
        <SignalLow className="h-3 w-3 text-status-offline" />
        <span className="text-status-offline">Offline</span>
      </>
    )}
  </div>
);

// Property list component for device info
const DeviceInfo: FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <div className="flex items-center justify-between">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-xs font-medium flex items-center gap-1">{children}</div>
  </div>
);

export const DeviceStatusCard: FC<{device: DeviceStatus}> = ({ device }) => (
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
          <StatusIndicator isOnline={device.isOnline} />
        </DeviceInfo>
        <DeviceInfo label="Last Seen">
          {formatDistanceToNow(device.last_seen, { addSuffix: true })}
        </DeviceInfo>
        <DeviceInfo label="Battery">
          <Battery className="h-3 w-3" />
          <span>{device.battery_level}%</span>
          <span className="text-xs text-muted-foreground">({device.battery_status})</span>
        </DeviceInfo>
        <DeviceInfo label="Network">
          <NetworkIcon networkType={device.network_type} />
          <span>{device.network_type || "Unknown"}</span>
        </DeviceInfo>
        <DeviceInfo label="OS">{device.os_version}</DeviceInfo>
      </CardContent>
    </Card>
  </Link>
);
