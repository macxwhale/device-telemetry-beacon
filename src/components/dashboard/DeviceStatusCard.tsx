
import { FC, memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeviceStatus } from "@/types/telemetry";
import { Battery, Trash2, Eye, Wifi, Smartphone } from "lucide-react";
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
    navigate(`/device/${device.id}`);
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

  const getBatteryStatus = (level: number) => {
    if (level > 60) return "Charging";
    if (level > 20) return "Normal";
    return "Low";
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "bg-green-500" : "bg-red-500";
  };

  const getNetworkIcon = (networkType: string) => {
    if (networkType?.toLowerCase().includes('wifi')) {
      return <Wifi className="h-3 w-3" />;
    }
    return <Smartphone className="h-3 w-3" />;
  };

  return (
    <Card className={`transition-colors hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            {onSelectionChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{device.name}</h3>
                <div 
                  className={`w-2 h-2 rounded-full ${getStatusColor(device.isOnline)}`}
                />
              </div>
              <p className="text-xs text-muted-foreground truncate">{device.model}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Battery Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Battery className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
            <span className="text-sm font-medium">{device.battery_level}%</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {getBatteryStatus(device.battery_level)}
          </span>
        </div>

        {/* Network Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getNetworkIcon(device.network_type)}
            <span className="text-sm">{device.network_type || 'Unknown'}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {device.ip_address || '0.0.0.0'}
          </span>
        </div>

        {/* Last Seen */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            Last seen {formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}
          </span>
          <Badge variant={device.isOnline ? "default" : "destructive"} className="text-xs">
            {device.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteDeviceMutation.isPending}
            className="px-3"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

DeviceStatusCard.displayName = 'DeviceStatusCard';
