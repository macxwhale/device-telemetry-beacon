
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { DeviceGroup } from '@/types/groups';
import { DeviceStatus } from '@/types/telemetry';
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
  const { refetch: refetchMemberships } = useDeviceGroupMemberships();
  const { data: assignedDevices = [], refetch: refetchGroupDevices } = useGroupDevices(group?.id);
  const assignDevice = useAssignDeviceToGroup();
  const removeDevice = useRemoveDeviceFromGroup();

  useEffect(() => {
    if (group) {
      console.log('🔄 Setting up dialog for group:', group.name);
      setEditedGroup({ ...group });
      setIsEditing(false);
      setSelectedDevices([]);
      
      // Refetch data when group changes
      refetchMemberships();
      refetchGroupDevices();
    }
  }, [group, refetchMemberships, refetchGroupDevices]);

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

    console.log(`🌈 Starting assignment of ${selectedDevices.length} devices to group ${group.id}`);

    try {
      // Assign each selected device
      for (const deviceId of selectedDevices) {
        console.log(`🌸 Assigning device ${deviceId} to group ${group.id}`);
        
        await assignDevice.mutateAsync({
          deviceId,
          groupId: group.id
        });
      }
      
      console.log('🎉 All devices assigned successfully!');
      
      // Clear selection and refresh data
      setSelectedDevices([]);
      await Promise.all([
        refetchMemberships(),
        refetchGroupDevices()
      ]);
      
    } catch (error) {
      console.error('💔 Failed to assign devices:', error);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!group) return;

    console.log(`🗑️ Removing device ${deviceId} from group ${group.id}`);

    try {
      await removeDevice.mutateAsync({
        deviceId,
        groupId: group.id
      });
      
      console.log('✅ Device removed successfully');
      
      // Refresh data
      await Promise.all([
        refetchMemberships(),
        refetchGroupDevices()
      ]);
      
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
