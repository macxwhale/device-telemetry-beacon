
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { DeviceStatus } from '@/types/telemetry';
import { DeviceGroup } from '@/types/groups';
import { isSupabaseUUID } from '@/types/device-ids';

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
  // Create a set of assigned device IDs for filtering
  const assignedDeviceIds = new Set(assignedDevices.map(device => device.id));

  // Filter available devices (not assigned to this group)
  const availableDevices = allDevices.filter(device => {
    const isValidUUID = isSupabaseUUID(device.id);
    const isNotAssigned = !assignedDeviceIds.has(device.id);
    
    console.log('🔍 Filtering device:', {
      id: device.id,
      android_id: device.android_id,
      name: device.name,
      isValidUUID,
      isNotAssigned,
      willBeIncluded: isValidUUID && isNotAssigned
    });
    
    if (!isValidUUID) {
      console.warn('⚠️ Device has invalid Supabase UUID:', {
        id: device.id,
        android_id: device.android_id,
        name: device.name
      });
      return false;
    }
    
    return isNotAssigned;
  });

  const handleDeviceSelection = (deviceId: string, checked: boolean) => {
    console.log(`🌈 Checkbox changed for device ${deviceId}: ${checked}`);
    if (checked) {
      setSelectedDevices([...selectedDevices, deviceId]);
    } else {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign Devices</CardTitle>
      </CardHeader>
      <CardContent>
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
        ) : (
          <div>
            {/* Enhanced Debug Info for UI */}
            <div className="mb-4 p-3 bg-muted rounded text-sm space-y-1">
              <strong>🔍 Debug Info:</strong>
              <div>Total devices in system: {allDevices.length}</div>
              <div>Devices assigned to this group: {assignedDevices.length}</div>
              <div>Available devices for assignment: {availableDevices.length}</div>
              <div>Currently selected: {selectedDevices.length}</div>
              <div>Group ID valid: {group?.id ? isSupabaseUUID(group.id) ? '✅' : '❌' : 'N/A'}</div>
              <div>Devices loading: {devicesLoading ? '🔄' : '✅'}</div>
              <div>Has devices error: {devicesError ? '❌' : '✅'}</div>
              {allDevices.length > 0 && (
                <div>First device ID format: {isSupabaseUUID(allDevices[0].id) ? '✅ Valid UUID' : '❌ Invalid UUID'}</div>
              )}
            </div>
            
            {availableDevices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available devices to assign</p>
                <p className="text-xs mt-1">
                  {allDevices.length === 0 
                    ? "No devices found in your system" 
                    : "All devices are already assigned to this group"
                  }
                </p>
                {allDevices.length > 0 && assignedDevices.length === allDevices.length && (
                  <p className="text-xs mt-1 text-yellow-600">
                    All {allDevices.length} devices are assigned to this group
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <ScrollArea className="h-40">
                  {availableDevices.map((device) => (
                    <div key={device.id} className="flex items-center space-x-2 p-2">
                      <Checkbox
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={(checked) => handleDeviceSelection(device.id, !!checked)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">{device.model}</p>
                        <p className="text-xs text-muted-foreground">ID: {device.id}</p>
                        {device.android_id && (
                          <p className="text-xs text-muted-foreground">Android ID: {device.android_id}</p>
                        )}
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
                    {assignDevicesPending ? '🔄 Assigning...' : `🎉 Assign ${selectedDevices.length} Device(s)`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
