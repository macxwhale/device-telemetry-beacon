
import React, { memo, useCallback } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { Battery, Server, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useDeleteDeviceMutation } from "@/hooks/useDevicesQuery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeviceStatusCardProps {
  device: DeviceStatus;
}

const DeviceStatusCard = memo(({ device }: DeviceStatusCardProps) => {
  const deleteDeviceMutation = useDeleteDeviceMutation();
  
  const handleDelete = useCallback(async () => {
    try {
      await deleteDeviceMutation.mutateAsync(device.id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [deleteDeviceMutation, device.id]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Memoize computed values
  const formattedLastSeen = React.useMemo(
    () => formatDistanceToNow(device.last_seen, { addSuffix: true }),
    [device.last_seen]
  );

  const statusColor = React.useMemo(
    () => device.isOnline ? "bg-status-online" : "bg-status-offline",
    [device.isOnline]
  );

  const borderColor = React.useMemo(
    () => device.isOnline ? "border-status-online/30" : "border-status-offline/30",
    [device.isOnline]
  );

  return (
    <div className="h-full">
      <Card className={`${borderColor} h-full transition-all hover:shadow-md`}>
        <Link to={`/devices/${device.id}`} className="block h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-semibold truncate">
                {device.name}
              </CardTitle>
              <div className={`h-2.5 w-2.5 rounded-full ${statusColor} animate-pulse-slow`}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {device.manufacturer} {device.model}
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-muted-foreground" />
                  <span>{device.battery_level}%</span>
                </div>
                <span className="text-xs">{device.battery_status}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span>{device.network_type}</span>
                </div>
                <span className="text-xs truncate max-w-[120px]" title={device.ip_address}>
                  {device.ip_address}
                </span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-2 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Last seen {formattedLastSeen}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm" 
                  className="h-7 px-2 text-destructive hover:bg-destructive/10"
                  onClick={stopPropagation}
                  disabled={deleteDeviceMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={stopPropagation}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Device</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {device.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={stopPropagation}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={(e) => {
                      stopPropagation(e);
                      handleDelete();
                    }}
                    disabled={deleteDeviceMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteDeviceMutation.isPending ? "Deleting..." : "Delete Device"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Link>
      </Card>
    </div>
  );
});

DeviceStatusCard.displayName = 'DeviceStatusCard';

export { DeviceStatusCard };
