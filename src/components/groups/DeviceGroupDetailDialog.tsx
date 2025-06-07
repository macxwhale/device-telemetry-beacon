import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Settings, 
  Trash2, 
  Save, 
  Plus, 
  X,
  Smartphone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DeviceGroup } from '@/types/groups';
import { DeviceStatus } from '@/types/telemetry';
import { isSupabaseUUID } from '@/types/device-ids';
import { useDevicesQuery } from '@/hooks/useDevicesQuery';
import { 
  useDeviceGroupMemberships, 
  useAssignDeviceToGroup, 
  useRemoveDeviceFromGroup,
  useGroupDevices 
} from '@/hooks/useDeviceGroups';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface DeviceGroupDetailDialogProps {
  group: DeviceGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (group: DeviceGroup) => Promise<void>;
  onDelete: (groupId: string) => Promise<void>;
}

export const DeviceGroupDetailDialog = ({
  group,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: DeviceGroupDetailDialogProps) => {
  const [editedGroup, setEditedGroup] = useState<DeviceGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  const { data: allDevices = [], isLoading: devicesLoading, error: devicesError } = useDevicesQuery();
  const { data: memberships = [], refetch: refetchMemberships } = useDeviceGroupMemberships();
  const { data: groupDevices = [], refetch: refetchGroupDevices } = useGroupDevices(group?.id);
  const assignDevice = useAssignDeviceToGroup();
  const removeDevice = useRemoveDeviceFromGroup();

  useEffect(() => {
    if (group) {
      // Validate group ID is a Supabase UUID
      if (!isSupabaseUUID(group.id)) {
        console.error('❌ Invalid group ID format:', group.id);
        return;
      }
      
      setEditedGroup({ ...group });
      setIsEditing(false);
      setSelectedDevices([]);
      
      // Refetch data when group changes
      refetchMemberships();
      refetchGroupDevices();
    }
  }, [group, refetchMemberships, refetchGroupDevices]);

  // Get devices assigned to this group using the new hook
  const assignedDevices = groupDevices;

  // Get available devices (not in this group) - filter by Supabase UUIDs and use device.id
  const assignedDeviceIds = new Set(assignedDevices.map(device => device.id));
  const availableDevices = allDevices.filter(device => {
    // Ensure we're working with Supabase UUIDs and use device.id for comparison
    if (!isSupabaseUUID(device.id)) {
      console.warn('⚠️ Device has invalid Supabase UUID:', device.id);
      return false;
    }
    return !assignedDeviceIds.has(device.id);
  });

  console.log('🔍 Group Detail Dialog Debug Info:');
  console.log('Group ID:', group?.id);
  console.log('All devices:', allDevices.length);
  console.log('Devices loading:', devicesLoading);
  console.log('Devices error:', devicesError);
  console.log('Group devices:', groupDevices.length);
  console.log('Assigned devices:', assignedDevices.length);
  console.log('Available devices:', availableDevices.length);
  console.log('Selected devices:', selectedDevices);
  
  // Enhanced debugging for device filtering
  console.log('📊 Detailed Device Analysis:');
  console.log('All devices details:', allDevices.map(d => ({ id: d.id, name: d.name, isValidUUID: isSupabaseUUID(d.id) })));
  console.log('Assigned device IDs:', Array.from(assignedDeviceIds));
  console.log('Available devices details:', availableDevices.map(d => ({ id: d.id, name: d.name })));

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
  ];

  const handleSave = async () => {
    if (!editedGroup) return;
    
    try {
      await onUpdate(editedGroup);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    
    try {
      await onDelete(group.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleAssignDevices = async () => {
    if (!group || selectedDevices.length === 0) {
      console.log('🚫 Cannot assign devices: no group or no devices selected');
      return;
    }

    // Validate group ID
    if (!isSupabaseUUID(group.id)) {
      console.error('❌ Invalid group ID format:', group.id);
      toast({
        title: "Invalid Group ID",
        description: "Group ID must be a valid Supabase UUID.",
        variant: "destructive",
      });
      return;
    }

    console.log(`🌈 Button clicked! Starting assignment of ${selectedDevices.length} devices to group ${group.id}`);
    console.log('Device IDs to assign (using device.id):', selectedDevices);
    console.log('Group ID:', group.id);

    // Validate all selected device IDs are Supabase UUIDs (these should be device.id values)
    const invalidDevices = selectedDevices.filter(deviceId => !isSupabaseUUID(deviceId));
    if (invalidDevices.length > 0) {
      console.error('❌ Invalid device ID formats:', invalidDevices);
      toast({
        title: "Invalid Device IDs",
        description: "All device IDs must be valid Supabase UUIDs.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Assign each selected device sequentially using device.id
      for (const deviceId of selectedDevices) {
        console.log(`🌸 Assigning device ${deviceId} to group ${group.id}`);
        
        let retryCount = 0;
        const maxRetries = 1;
        
        while (retryCount <= maxRetries) {
          try {
            await assignDevice.mutateAsync({
              deviceId, // This is now device.id (Supabase UUID)
              groupId: group.id // Supabase UUID
            });
            console.log(`✅ Successfully assigned device ${deviceId}`);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.log(`🔄 Retrying assignment for device ${deviceId} (attempt ${retryCount + 1})`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            } else {
              console.error(`💔 Failed to assign device ${deviceId} after ${maxRetries + 1} attempts:`, error);
              throw error; // Re-throw after max retries
            }
          }
        }
      }
      
      console.log('🎉 All devices assigned successfully!');
      
      // Clear selected devices immediately
      setSelectedDevices([]);
      
      // Force refresh both membership and group device data
      await Promise.all([
        refetchMemberships(),
        refetchGroupDevices()
      ]);
      
      console.log('🔄 Data refreshed');
    } catch (error) {
      console.error('💔 Failed to assign devices:', error);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!group) return;

    // Validate IDs are Supabase UUIDs - deviceId should be device.id
    if (!isSupabaseUUID(deviceId) || !isSupabaseUUID(group.id)) {
      console.error('❌ Invalid ID format - Device:', deviceId, 'Group:', group.id);
      toast({
        title: "Invalid ID Format",
        description: "Both device and group IDs must be valid Supabase UUIDs.",
        variant: "destructive",
      });
      return;
    }

    console.log(`🗑️ Removing device ${deviceId} from group ${group.id}`);

    try {
      await removeDevice.mutateAsync({
        deviceId, // Using device.id (Supabase UUID)
        groupId: group.id // Supabase UUID
      });
      
      console.log('✅ Device removed successfully');
      
      // Force refresh both membership and group device data
      await Promise.all([
        refetchMemberships(),
        refetchGroupDevices()
      ]);
      
      console.log('🔄 Data refreshed after removal');
    } catch (error) {
      console.error('💔 Failed to remove device:', error);
    }
  };

  if (!group || !editedGroup) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isEditing ? 'Edit Group' : 'Group Details'}
            </DialogTitle>
            <DialogDescription>
              Manage group settings and device assignments
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Group Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Group Information
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditedGroup({ ...group });
                            setIsEditing(false);
                          }}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                            <Settings className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={editedGroup.name}
                      onChange={(e) => setEditedGroup(prev => prev ? { ...prev, name: e.target.value } : null)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedGroup.description || ''}
                      onChange={(e) => setEditedGroup(prev => prev ? { ...prev, description: e.target.value } : null)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            editedGroup.color === color ? 'border-gray-800' : 'border-gray-300'
                          } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => isEditing && setEditedGroup(prev => prev ? { ...prev, color } : null)}
                          disabled={!isEditing}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(group.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      {assignedDevices.length} devices
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assign New Devices - Always show this section */}
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
                      <div className="mb-4 p-3 bg-muted rounded text-sm">
                        <strong>Debug Info:</strong>
                        <br />Total devices: {allDevices.length}
                        <br />Assigned to group: {assignedDevices.length}
                        <br />Available: {availableDevices.length}
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
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ScrollArea className="h-40">
                            {availableDevices.map((device) => (
                              <div key={device.id} className="flex items-center space-x-2 p-2">
                                <Checkbox
                                  checked={selectedDevices.includes(device.id)}
                                  onCheckedChange={(checked) => {
                                    console.log(`🌈 Checkbox changed for device ${device.id}: ${checked}`);
                                    if (checked) {
                                      setSelectedDevices(prev => {
                                        const newSelection = [...prev, device.id]; // Using device.id
                                        console.log('New selection:', newSelection);
                                        return newSelection;
                                      });
                                    } else {
                                      setSelectedDevices(prev => {
                                        const newSelection = prev.filter(id => id !== device.id); // Using device.id
                                        console.log('New selection after removal:', newSelection);
                                        return newSelection;
                                      });
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{device.name}</p>
                                  <p className="text-sm text-muted-foreground">{device.model}</p>
                                  <p className="text-xs text-muted-foreground">UUID: {device.id}</p>
                                </div>
                                <Badge variant={device.isOnline ? "default" : "secondary"}>
                                  {device.isOnline ? 'Online' : 'Offline'}
                                </Badge>
                              </div>
                            ))}
                          </ScrollArea>
                          
                          {selectedDevices.length > 0 && (
                            <Button 
                              onClick={handleAssignDevices}
                              disabled={assignDevice.isPending}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {assignDevice.isPending ? '💛 Assigning...' : `🎉 Assign ${selectedDevices.length} Device(s)`}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assigned Devices - Updated to use device.id */}
            <div>
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
                                  UUID: {device.id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Android ID: {device.android_id}
                                </p>
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
                                onClick={() => handleRemoveDevice(device.id)} // Using device.id
                                disabled={removeDevice.isPending}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.name}"? This will remove all device assignments from this group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
