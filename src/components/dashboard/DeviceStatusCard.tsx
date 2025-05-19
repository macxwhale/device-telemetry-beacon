import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Battery, SignalHigh, SignalLow, Wifi, Smartphone, Globe } from "lucide-react";

// Helper functions to keep component clean and under 50 lines
const getNetworkIcon = (networkType: string) => {
  if (!networkType || networkType === "Unknown") {
    return <Globe className="h-3 w-3" />;
  } else if (networkType.toLowerCase().includes("wifi")) {
    return <Wifi className="h-3 w-3" />;
  } else if (networkType.toLowerCase().includes("mobile")) {
    return <Smartphone className="h-3 w-3" />;
  } else {
    return <Globe className="h-3 w-3" />;
  }
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

interface DeviceStatusCardProps {
  device: DeviceStatus;
}

export const DeviceStatusCard: FC<DeviceStatusCardProps> = ({ device }) => {
  const displayNetworkType = device.network_type || "Unknown";
  
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
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-xs font-medium flex items-center gap-1">
              <StatusIndicator isOnline={device.isOnline} />
            </div>
          </div>
          
          {/* Essential device info - keep under 50 lines */}
          <DeviceCardInfo 
            lastSeen={device.last_seen}
            batteryLevel={device.battery_level}
            batteryStatus={device.battery_status}
            networkType={displayNetworkType}
            osVersion={device.os_version}
          />
        </CardContent>
      </Card>
    </Link>
  );
};

interface DeviceCardInfoProps {
  lastSeen: number;
  batteryLevel: number;
  batteryStatus: string;
  networkType: string;
  osVersion: string;
}

const DeviceCardInfo: FC<DeviceCardInfoProps> = ({
  lastSeen, batteryLevel, batteryStatus, networkType, osVersion
}) => (
  <>
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">Last Seen</div>
      <div className="text-xs font-medium">
        {formatDistanceToNow(lastSeen, { addSuffix: true })}
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">Battery</div>
      <div className="text-xs font-medium flex items-center gap-1">
        <Battery className="h-3 w-3" />
        <span>{batteryLevel}%</span>
        <span className="text-xs text-muted-foreground">({batteryStatus})</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">Network</div>
      <div className="text-xs font-medium flex items-center gap-1">
        {getNetworkIcon(networkType)}
        <span>{networkType}</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">OS</div>
      <div className="text-xs font-medium">{osVersion}</div>
    </div>
  </>
);
