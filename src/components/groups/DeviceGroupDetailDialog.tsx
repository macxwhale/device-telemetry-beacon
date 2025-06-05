
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
  Calendar
} from 'lucide-react';
import { DeviceGroup } from '@/types/groups';
import { DeviceStatus } from '@/types/telemetry';
import { useDevicesQuery } from '@/hooks/useDevicesQuery';
import { useDeviceGroupMemberships, useAssignDeviceToGroup } from '@/hooks/useDeviceGroups';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

  const { data: allDevices = [] } = useDevicesQuery();
  const { data: memberships = [] } = useDeviceGroupMemberships();
  const assignDevice = useAssignDeviceToGroup();

  useEffect(() => {
    if (group) {
      setEditedGroup({ ...group });
      setIsEditing(false);
    }
  }, [group]);

  // Get devices assigned to this group
  const assignedDevices = group ? allDevices.filter(device => 
    memberships.some(m => m.device_id === device.id && m.group_id === group.id)
  ) : [];

  // Get available devices (not in this group)
  const availableDevices = group ? allDevices.filter(device => 
    !memberships.some(m => m.device_id === device.id && m.group_id === group.id)
  ) : [];

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
    if (!group || selectedDevices.length === 0) return;

    try {
      for (const deviceId of selectedDevices) {
        await assignDevice.mutateAsync({
          deviceId,
          groupId: group.id
        });
      }
      setSelectedDevices([]);
    } catch (error) {
      console.error('Failed to assign devices:', error);
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

              {/* Assign New Devices */}
              {availableDevices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assign Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <ScrollArea className="h-40">
                        {availableDevices.map((device) => (
                          <div key={device.id} className="flex items-center space-x-2 p-2">
                            <Checkbox
                              checked={selectedDevices.includes(device.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDevices(prev => [...prev, device.id]);
                                } else {
                                  setSelectedDevices(prev => prev.filter(id => id !== device.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">{device.model}</p>
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
                          Assign {selectedDevices.length} Device(s)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Assigned Devices */}
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
