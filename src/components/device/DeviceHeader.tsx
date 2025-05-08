
import { FC } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { formatDistanceToNow } from "date-fns";
import { Battery, SignalHigh, SignalLow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DeviceHeaderProps {
  device: DeviceStatus;
  onRefresh: () => void;
}

export const DeviceHeader: FC<DeviceHeaderProps> = ({ device, onRefresh }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <div 
              className={`h-3 w-3 rounded-full ${device.isOnline ? "bg-status-online" : "bg-status-offline"} animate-pulse-slow`}
            ></div>
            <span className={device.isOnline ? "text-status-online" : "text-status-offline"}>
              {device.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-muted-foreground">
            {device.manufacturer} {device.model} • {device.os_version}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm">Refresh</Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/devices">Back to Devices</Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border rounded-md p-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Last Seen</p>
          <p className="text-sm font-medium">
            {formatDistanceToNow(device.last_seen, { addSuffix: true })}
          </p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Battery</p>
          <div className="flex items-center gap-1">
            <Battery className="h-4 w-4" />
            <span className="text-sm font-medium">
              {device.battery_level}% ({device.battery_status})
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Network</p>
          <div className="flex items-center gap-1">
            {device.isOnline ? (
              <SignalHigh className="h-4 w-4" />
            ) : (
              <SignalLow className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {device.network_type} • {device.ip_address}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Uptime</p>
          <p className="text-sm font-medium">
            {Math.floor(device.uptime_millis / (1000 * 60 * 60))} hours
          </p>
        </div>
      </div>
    </div>
  );
};
