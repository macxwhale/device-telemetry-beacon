
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Battery, SignalHigh, SignalLow } from "lucide-react";

interface DeviceStatusCardProps {
  device: DeviceStatus;
}

export const DeviceStatusCard: FC<DeviceStatusCardProps> = ({ device }) => {
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
              {device.isOnline ? (
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
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Last Seen</div>
            <div className="text-xs font-medium">
              {formatDistanceToNow(device.last_seen, { addSuffix: true })}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Battery</div>
            <div className="text-xs font-medium flex items-center gap-1">
              <Battery className="h-3 w-3" />
              <span>{device.battery_level}%</span>
              <span className="text-xs text-muted-foreground">({device.battery_status})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Network</div>
            <div className="text-xs font-medium">{device.network_type}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">OS</div>
            <div className="text-xs font-medium">{device.os_version}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
