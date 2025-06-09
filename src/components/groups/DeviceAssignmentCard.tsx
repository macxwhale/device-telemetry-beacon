
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Smartphone,
  AlertCircle,
  Info
} from 'lucide-react';
import { DeviceStatus } from '@/types/telemetry';
import { DeviceGroup } from '@/types/groups';
import { DeviceAssignmentService } from '@/services/deviceAssignmentService';

interface DeviceAssignmentCardProps {
  group: DeviceGroup;
  allDevices: DeviceStatus[];
  assignedDevices: DeviceStatus[];
  devicesLoading: boolean;
  devicesError: Error | null;
  selectedDevices: string[];
  setSelectedDevices: (devices: string[]) => void;
  onAssignDevices: () => Promise<void>;
  assignDevicesPending: boolean;
}

export const DeviceAssignmentCard = ({
  group,
  allDevices,
  assignedDevices,
  devicesLoading,
  devicesError,
  selectedDevices,
  setSelectedDevices,
  onAssignDevices,
  assignDevicesPending
}: DeviceAssignmentCardProps) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Filter available devices using the service
  const availableDevices = DeviceAssignmentService.filterAvailableDevices(allDevices, assignedDevices);

  const handleDeviceSelection = (deviceId: string, checked: boolean) => {
    console.log(`📝 Device selection changed: ${deviceId} = ${checked}`);
    if (checked) {
      setSelectedDevices([...selectedDevices, deviceId]);
    } else {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    }
  };

  const debugInfo = {
    totalDevices: allDevices.length,
    assignedDevices: assignedDevices.length,
    availableDevices: availableDevices.length,
    selectedDevices: selectedDevices.length,
    groupIdValid: !!group?.id,
    devicesLoading,
    hasError: !!devicesError
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Assign Devices
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showDebugInfo && (
          <div className="mb-4 p-3 bg-muted rounded text-sm space-y-1">
            <strong>🔍 Debug Info:</strong>
            <div>Total devices: {debugInfo.totalDevices}</div>
            <div>Assigned to group: {debugInfo.assignedDevices}</div>
            <div>Available for assignment: {debugInfo.availableDevices}</div>
            <div>Currently selected: {debugInfo.selectedDevices}</div>
            <div>Group ID valid: {debugInfo.groupIdValid ? '✅' : '❌'}</div>
            <div>Loading: {debugInfo.devicesLoading ? '🔄' : '✅'}</div>
            <div>Has error: {debugInfo.hasError ? '❌' : '✅'}</div>
          </div>
        )}

        {devicesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading devices...</p>
            </div>
          </div>
        ) : devicesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">Failed to load devices</p>
              <p className="text-xs text-muted-foreground">{devicesError.message}</p>
            </div>
          </div>
        ) : availableDevices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No available devices to assign</p>
            <p className="text-xs mt-1">
              {allDevices.length === 0 
                ? "No devices found in your system" 
                : "All devices are already assigned to this group"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <ScrollArea className="h-40">
              {availableDevices.map((device) => (
                <div key={device.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                  <Checkbox
                    checked={selectedDevices.includes(device.id)}
                    onCheckedChange={(checked) => handleDeviceSelection(device.id, !!checked)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.manufacturer} {device.model}
                    </p>
                  </div>
                  <Badge variant={device.isOnline ? "default" : "secondary"}>
                    {device.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              ))}
            </ScrollArea>
            
            {selectedDevices.length > 0 && (
              <Button 
                onClick={onAssignDevices}
                disabled={assignDevicesPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {assignDevicesPending 
                  ? `Assigning ${selectedDevices.length} device(s)...` 
                  : `Assign ${selectedDevices.length} Device(s)`
                }
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
