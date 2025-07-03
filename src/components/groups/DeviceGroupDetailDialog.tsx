
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { DeviceGroup } from '@/types/groups';
import { useDevicesQuery } from '@/hooks/useDevicesQuery';
import { 
  useDeviceGroupMemberships, 
  useAssignDeviceToGroup, 
  useRemoveDeviceFromGroup,
  useGroupDevices 
} from '@/hooks/useDeviceGroups';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { GroupInformationCard } from './GroupInformationCard';
import { DeviceAssignmentCard } from './DeviceAssignmentCard';
import { AssignedDevicesCard } from './AssignedDevicesCard';
import { useDeviceGroupDialog } from './hooks/useDeviceGroupDialog';

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
  const {
    editedGroup,
    setEditedGroup,
    isEditing,
    setIsEditing,
    showDeleteDialog,
    setShowDeleteDialog,
    selectedDevices,
    setSelectedDevices,
    handleSave,
    handleDelete,
    handleAssignDevices,
    handleRemoveDevice
  } = useDeviceGroupDialog({ group, onUpdate, onDelete, onClose });

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
  }, [group, refetchMemberships, refetchGroupDevices, setEditedGroup, setIsEditing, setSelectedDevices]);

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
                onSave={() => handleSave(handleSave)}
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
                onAssignDevices={() => handleAssignDevices(assignDevice, refetchMemberships, refetchGroupDevices)}
                assignDevicesPending={assignDevice.isPending}
              />
            </div>

            {/* Assigned Devices */}
            <div>
              <AssignedDevicesCard
                assignedDevices={assignedDevices}
                onRemoveDevice={(deviceId) => handleRemoveDevice(deviceId, removeDevice, refetchMemberships, refetchGroupDevices)}
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
              onClick={() => handleDelete(handleDelete)}
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
