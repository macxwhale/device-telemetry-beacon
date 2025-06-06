
import { FC, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeviceStatus } from "@/types/telemetry";
import { Battery, Trash2, Eye, Wifi, Smartphone, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useDeleteDeviceMutation } from "@/hooks/useDevicesQuery";

interface DeviceStatusCardProps {
  device: DeviceStatus;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export const DeviceStatusCard: FC<DeviceStatusCardProps> = memo(({ 
  device, 
  isSelected = false,
  onSelectionChange 
}) => {
  const navigate = useNavigate();
  const deleteDeviceMutation = useDeleteDeviceMutation();

  const handleViewDetails = () => {
    navigate(`/devices/${device.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDeviceMutation.mutate(device.id);
  };

  const handleSelectionChange = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return "text-green-500";
    if (level > 20) return "text-yellow-500";
    return "text-red-500";
  };

  const getBatteryBarColor = (level: number) => {
    if (level > 60) return "bg-green-500";
    if (level > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Determine actual device status based on last_seen and current time
  const isDeviceOnline = () => {
    if (!device.last_seen) return false;
    const lastSeenTime = new Date(device.last_seen).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastSeenTime;
    // Consider device offline if not seen for more than 15 minutes (900000 ms)
    return timeDiff < 900000;
  };

  const deviceOnlineStatus = isDeviceOnline();
  const statusColor = deviceOnlineStatus ? "bg-green-500" : "bg-red-500";
  const statusBorderColor = deviceOnlineStatus ? "border-green-500" : "border-red-500";

  const getNetworkIcon = (networkType: string) => {
    if (networkType?.toLowerCase().includes('wifi')) {
      return <Wifi className="h-4 w-4" />;
    }
    return <Smartphone className="h-4 w-4" />;
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border ${statusBorderColor} ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
      {/* Header Section */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {onSelectionChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{device.name}</h3>
                <div 
                  className={`w-2 h-2 rounded-full ${statusColor} ${deviceOnlineStatus ? 'animate-pulse' : ''}`}
                  title={deviceOnlineStatus ? 'Online' : 'Offline'}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{device.model}</p>
            </div>
          </div>
        </div>

        {/* Status Badge with real-time status */}
        <div className="flex justify-between items-center mb-4">
          <Badge 
            variant={deviceOnlineStatus ? "default" : "destructive"} 
            className={`text-xs px-2 py-1 ${deviceOnlineStatus ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}
          >
            {deviceOnlineStatus ? 'Online' : 'Offline'}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : 'Never seen'}
          </span>
        </div>

        {/* Battery Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Battery className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Battery</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{device.battery_level}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getBatteryBarColor(device.battery_level)}`}
                style={{ width: `${device.battery_level}%` }}
              />
            </div>
          </div>
        </div>

        {/* Device Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Network */}
          <div className="flex items-center gap-2">
            {getNetworkIcon(device.network_type)}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Network</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {device.network_type || 'Unknown'}
              </p>
            </div>
          </div>

          {/* IP Address */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                {device.ip_address || '0.0.0.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <CardContent className="p-4 pt-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1 h-8 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteDeviceMutation.isPending}
            className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

DeviceStatusCard.displayName = 'DeviceStatusCard';
