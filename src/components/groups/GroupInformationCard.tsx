
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Trash2, 
  Save, 
  Calendar,
  Smartphone
} from 'lucide-react';
import { DeviceGroup } from '@/types/groups';

interface GroupInformationCardProps {
  group: DeviceGroup;
  editedGroup: DeviceGroup;
  setEditedGroup: (group: DeviceGroup | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  assignedDevicesCount: number;
  onSave: () => Promise<void>;
  onDelete: () => void;
}

export const GroupInformationCard = ({
  group,
  editedGroup,
  setEditedGroup,
  isEditing,
  setIsEditing,
  assignedDevicesCount,
  onSave,
  onDelete
}: GroupInformationCardProps) => {
  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
  ];

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGroup({ ...group });
    setIsEditing(false);
  };

  return (
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
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={onDelete}>
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
            onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
            disabled={!isEditing}
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editedGroup.description || ''}
            onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
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
                onClick={() => isEditing && setEditedGroup({ ...editedGroup, color })}
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
            {assignedDevicesCount} devices
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
