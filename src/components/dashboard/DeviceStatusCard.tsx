
import { FC, memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeviceStatus } from "@/types/telemetry";
import { Battery, Trash2, Eye } from "lucide-react";
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

  const getStatusBadgeVariant = (isOnline: boolean) => {
    return isOnline ? "default" : "destructive";
  };

  return (
    <Card className={`h-48 transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {onSelectionChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <h3 className="font-medium text-sm truncate flex-1">{device.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <Badge 
              variant={getStatusBadgeVariant(device.isOnline)}
              className="text-xs py-0 px-1"
            >
              {device.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">{device.model}</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Battery</span>
            <span className={getBatteryColor(device.battery_level)}>
              {device.battery_level}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Temperature</span>
            <span>{device.temperature?.toFixed(1) || '--'}°C</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1">
            <Battery className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
            <span className="text-xs font-medium">{device.battery_level}%</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1 mr-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteDeviceMutation.isPending}
            className="px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

DeviceStatusCard.displayName = 'DeviceStatusCard';
