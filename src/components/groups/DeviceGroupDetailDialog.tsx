
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { GroupInformationCard } from './GroupInformationCard';
import { DeviceAssignmentCard } from './DeviceAssignmentCard';
import { AssignedDevicesCard } from './AssignedDevicesCard';

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
      console.log('🔄 Group changed, setting up dialog for group:', {
        groupId: group.id,
        groupName: group.name,
        isValidGroupId: isSupabaseUUID(group.id)
      });
      
      // Validate group ID is a Supabase UUID
      if (!isSupabaseUUID(group.id)) {
        console.error('❌ Invalid group ID format:', group.id);
        return;
      }
      
      setEditedGroup({ ...group });
      setIsEditing(false);
      setSelectedDevices([]);
      
      // Refetch data when group changes
      console.log('🔄 Refetching memberships and group devices...');
      refetchMemberships();
      refetchGroupDevices();
    }
  }, [group, refetchMemberships, refetchGroupDevices]);

  // Comprehensive logging for device data analysis
  console.log('=== DEVICE GROUP DIALOG DEBUG START ===');
  console.log('📊 Current State:', {
    isOpen,
    groupId: group?.id,
    groupName: group?.name,
    selectedDevices: selectedDevices.length,
    isEditing
  });

  console.log('📱 ALL DEVICES ANALYSIS:');
  console.log('Total devices from query:', allDevices.length);
  console.log('Devices loading:', devicesLoading);
  console.log('Devices error:', devicesError);
  
  if (allDevices.length > 0) {
    console.log('First 3 devices structure:', allDevices.slice(0, 3).map(d => ({
      id: d.id,
      android_id: d.android_id || 'NO_ANDROID_ID',
      name: d.name,
      isValidId: isSupabaseUUID(d.id),
      hasAndroidId: !!d.android_id,
      idType: typeof d.id,
      androidIdType: typeof d.android_id
    })));
  }

  console.log('🔗 GROUP DEVICES ANALYSIS:');
  console.log('Group devices count:', groupDevices.length);
  if (groupDevices.length > 0) {
    console.log('Group devices structure:', groupDevices.map(d => ({
      id: d.id,
      android_id: d.android_id || 'NO_ANDROID_ID',
      name: d.name,
      isValidId: isSupabaseUUID(d.id),
      membership_id: d.membership_id
    })));
  }

  // Get devices assigned to this group
  const assignedDevices = groupDevices;
  console.log('📍 ASSIGNED DEVICES:', assignedDevices.length);

  console.log('🎯 FILTERING SUMMARY:');
  console.log('Total devices:', allDevices.length);
  console.log('Assigned devices:', assignedDevices.length);
  console.log('Selected devices:', selectedDevices.length);
  console.log('=== DEVICE GROUP DIALOG DEBUG END ===');

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

    // Validate all selected device IDs are Supabase UUIDs
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
      // Assign each selected device sequentially
      for (const deviceId of selectedDevices) {
        console.log(`🌸 Assigning device ${deviceId} to group ${group.id}`);
        
        let retryCount = 0;
        const maxRetries = 1;
        
        while (retryCount <= maxRetries) {
          try {
            await assignDevice.mutateAsync({
              deviceId, // This is device.id (Supabase UUID)
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

    // Validate IDs are Supabase UUIDs
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
              <GroupInformationCard
                group={group}
                editedGroup={editedGroup}
                setEditedGroup={setEditedGroup}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                assignedDevicesCount={assignedDevices.length}
                onSave={handleSave}
                onDelete={() => setShowDeleteDialog(true)}
              />

              <DeviceAssignmentCard
                group={group}
                allDevices={allDevices}
                assignedDevices={assignedDevices}
                devicesLoading={devicesLoading}
                devicesError={devicesError}
                selectedDevices={selectedDevices}
                setSelectedDevices={setSelectedDevices}
                onAssignDevices={handleAssignDevices}
                assignDevicesPending={assignDevice.isPending}
              />
            </div>

            {/* Assigned Devices */}
            <div>
              <AssignedDevicesCard
                assignedDevices={assignedDevices}
                onRemoveDevice={handleRemoveDevice}
                removeDevicePending={removeDevice.isPending}
              />
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
