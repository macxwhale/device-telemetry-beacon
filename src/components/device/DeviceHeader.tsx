
import { FC, useState } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { formatDistanceToNow } from "date-fns";
import { Battery, SignalHigh, SignalLow, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useDevices } from "@/contexts/DeviceContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Header tile component to reduce repetition
const HeaderTile: FC<{label: string; children: React.ReactNode}> = ({ label, children }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="text-sm font-medium flex items-center gap-1">{children}</div>
  </div>
);

interface DeviceHeaderProps {
  device: DeviceStatus;
  onRefresh: () => void;
}

export const DeviceHeader: FC<DeviceHeaderProps> = ({ device, onRefresh }) => {
  const { deleteDeviceById } = useDevices();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteDeviceById(device.id);
    setIsDeleting(false);
    if (success) {
      navigate("/devices");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <div className={`h-3 w-3 rounded-full ${device.isOnline ? "bg-status-online" : "bg-status-offline"} animate-pulse-slow`}></div>
            <span className={device.isOnline ? "text-status-online" : "text-status-offline"}>
              {device.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-muted-foreground">{device.manufacturer} {device.model} • {device.os_version}</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm">Refresh</Button>
          <Button asChild variant="outline" size="sm"><Link to="/devices">Back to Devices</Link></Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Device</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {device.name}? This action cannot be undone and will permanently
                  remove the device and all its telemetry data from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border rounded-md p-4">
        <HeaderTile label="Last Seen">{formatDistanceToNow(device.last_seen, { addSuffix: true })}</HeaderTile>
        <HeaderTile label="Battery"><Battery className="h-4 w-4" />{device.battery_level}% ({device.battery_status})</HeaderTile>
        <HeaderTile label="Network">
          {device.isOnline ? <SignalHigh className="h-4 w-4" /> : <SignalLow className="h-4 w-4" />}
          {device.network_type} • {device.ip_address}
        </HeaderTile>
        <HeaderTile label="Uptime">{Math.floor(device.uptime_millis / (1000 * 60 * 60))} hours</HeaderTile>
      </div>
    </div>
  );
};
