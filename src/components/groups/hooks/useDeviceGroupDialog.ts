
import { useState } from 'react';
import { DeviceGroup } from '@/types/groups';

interface UseDeviceGroupDialogProps {
  group: DeviceGroup | null;
  onUpdate: (group: DeviceGroup) => Promise<void>;
  onDelete: (groupId: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Custom hook to manage device group dialog state and actions
 * Follows separation of concerns principle
 */
export const useDeviceGroupDialog = ({
  group,
  onUpdate,
  onDelete,
  onClose
}: UseDeviceGroupDialogProps) => {
  const [editedGroup, setEditedGroup] = useState<DeviceGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  const handleSave = async (saveFunction: () => Promise<void>) => {
    if (!editedGroup) return;
    
    try {
      await onUpdate(editedGroup);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDelete = async (deleteFunction: () => Promise<void>) => {
    if (!group) return;
    
    try {
      await onDelete(group.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleAssignDevices = async (
    assignDevice: any,
    refetchMemberships: () => void,
    refetchGroupDevices: () => void
  ) => {
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

  const handleRemoveDevice = async (
    deviceId: string,
    removeDevice: any,
    refetchMemberships: () => void,
    refetchGroupDevices: () => void
  ) => {
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

  return {
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
  };
};
