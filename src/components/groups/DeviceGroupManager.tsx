
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useDeviceGroups, 
  useCreateDeviceGroup, 
  useUpdateDeviceGroup, 
  useDeleteDeviceGroup,
  useDeviceGroupMemberships 
} from '@/hooks/useDeviceGroups';
import { DeviceGroupDetailDialog } from './DeviceGroupDetailDialog';
import { DeviceGroup } from '@/types/groups';

export const DeviceGroupManager = () => {
  const { data: groups = [], isLoading } = useDeviceGroups();
  const { data: memberships = [] } = useDeviceGroupMemberships();
  const createGroup = useCreateDeviceGroup();
  const updateGroup = useUpdateDeviceGroup();
  const deleteGroup = useDeleteDeviceGroup();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DeviceGroup | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    
    try {
      await createGroup.mutateAsync(newGroup);
      setNewGroup({ name: '', description: '', color: '#3B82F6' });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleManageGroup = (group: DeviceGroup) => {
    setSelectedGroup(group);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateGroup = async (group: DeviceGroup) => {
    await updateGroup.mutateAsync(group);
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteGroup.mutateAsync(groupId);
  };

  // Count devices per group
  const getDeviceCount = (groupId: string) => {
    return memberships.filter(m => m.group_id === groupId).length;
  };

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
  ];

  if (isLoading) {
    return <div className="animate-pulse">Loading groups...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Device Groups
              </CardTitle>
              <CardDescription>
                Organize devices into logical groups for better management
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Device Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to organize your devices
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter group description"
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newGroup.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewGroup(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateGroup}
                      disabled={createGroup.isPending || !newGroup.name.trim()}
                    >
                      Create Group
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const deviceCount = getDeviceCount(group.id);
              return (
                <Card key={group.id} className="border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: group.color }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="secondary" style={{ backgroundColor: `${group.color}20`, color: group.color }}>
                        <Users className="h-3 w-3 mr-1" />
                        {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleManageGroup(group)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            
            {groups.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No device groups created yet</p>
                <p className="text-sm">Create your first group to organize your devices</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DeviceGroupDetailDialog
        group={selectedGroup}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedGroup(null);
        }}
        onUpdate={handleUpdateGroup}
        onDelete={handleDeleteGroup}
      />
    </>
  );
};
