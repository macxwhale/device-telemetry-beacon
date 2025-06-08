
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X,
  Smartphone
} from 'lucide-react';
import { DeviceStatus } from '@/types/telemetry';

interface AssignedDevicesCardProps {
  assignedDevices: DeviceStatus[];
  onRemoveDevice: (deviceId: string) => Promise<void>;
  removeDevicePending: boolean;
}

export const AssignedDevicesCard = ({
  assignedDevices,
  onRemoveDevice,
  removeDevicePending
}: AssignedDevicesCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Assigned Devices ({assignedDevices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {assignedDevices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No devices assigned to this group</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.manufacturer} {device.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {device.id}
                      </p>
                      {device.android_id && (
                        <p className="text-xs text-muted-foreground">
                          Android ID: {device.android_id}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.isOnline ? "default" : "secondary"}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onRemoveDevice(device.id)}
                      disabled={removeDevicePending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
