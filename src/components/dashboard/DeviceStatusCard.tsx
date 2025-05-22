
import { DeviceStatus } from "@/types/telemetry";
import { Battery, Server, Smartphone, Trash } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useDevices } from "@/contexts/DeviceContext";

interface DeviceStatusCardProps {
  device: DeviceStatus;
}

export function DeviceStatusCard({ device }: DeviceStatusCardProps) {
  const { deleteDeviceById } = useDevices();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsDeleting(true);
      await deleteDeviceById(device.id);
    } catch (error) {
      console.error("Failed to delete device:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link to={`/devices/${device.id}`} className="block">
      <Card className={`${device.isOnline ? "border-status-online/30" : "border-status-offline/30"} transition-all hover:shadow-md`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold truncate">
              {device.name}
            </CardTitle>
            <div className={`h-2.5 w-2.5 rounded-full ${device.isOnline ? "bg-status-online" : "bg-status-offline"} animate-pulse-slow`}></div>
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
              <span className="text-xs truncate max-w-[120px]" title={device.ip_address}>{device.ip_address}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Last seen {formatDistanceToNow(device.last_seen, { addSuffix: true })}
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete device</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Device</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {device.name}? This action cannot be undone and will permanently
                  remove the device and all its telemetry data from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete Device"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </Link>
  );
}
