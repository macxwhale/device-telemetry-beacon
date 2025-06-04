
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useCreateAutomationRule, useUpdateAutomationRule } from '@/hooks/useAutomation';
import { AutomationRule } from '@/types/automation';

interface AutomationRuleEditorProps {
  rule?: AutomationRule | null;
  onClose: () => void;
}

export const AutomationRuleEditor = ({ rule, onClose }: AutomationRuleEditorProps) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger_type: rule?.trigger_type || 'device_event',
    enabled: rule?.enabled ?? true,
    trigger_conditions: rule?.trigger_conditions || {},
    actions: rule?.actions || []
  });

  const [newCondition, setNewCondition] = useState({ field: '', operator: '', value: '' });
  const [newAction, setNewAction] = useState({ type: '', config: {} });

  const createMutation = useCreateAutomationRule();
  const updateMutation = useUpdateAutomationRule();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ruleData = {
      ...formData,
      created_by: 'current-user', // This would come from auth context
      organization_id: 'default-org' // This would come from user's organization
    };

    try {
      if (rule) {
        await updateMutation.mutateAsync({ id: rule.id, ...ruleData });
      } else {
        await createMutation.mutateAsync(ruleData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save automation rule:', error);
    }
  };

  const addCondition = () => {
    if (newCondition.field && newCondition.operator && newCondition.value) {
      const conditions = Array.isArray(formData.trigger_conditions) 
        ? formData.trigger_conditions 
        : [];
      
      setFormData({
        ...formData,
        trigger_conditions: [...conditions, newCondition]
      });
      setNewCondition({ field: '', operator: '', value: '' });
    }
  };

  const removeCondition = (index: number) => {
    const conditions = Array.isArray(formData.trigger_conditions) 
      ? formData.trigger_conditions 
      : [];
    
    setFormData({
      ...formData,
      trigger_conditions: conditions.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    if (newAction.type) {
      setFormData({
        ...formData,
        actions: [...formData.actions, newAction]
      });
      setNewAction({ type: '', config: {} });
    }
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const conditions = Array.isArray(formData.trigger_conditions) 
    ? formData.trigger_conditions 
    : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_type">Trigger Type</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="device_event">Device Event</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this rule does"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
            />
            <Label htmlFor="enabled">Enable this rule</Label>
          </div>

          {/* Trigger Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trigger Conditions</CardTitle>
              <CardDescription>
                Define when this automation should trigger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Field (e.g., battery_level)"
                  value={newCondition.field}
                  onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
                />
                <Select
                  value={newCondition.operator}
                  onValueChange={(value) => setNewCondition({ ...newCondition, operator: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<">Less than</SelectItem>
                    <SelectItem value=">">Greater than</SelectItem>
                    <SelectItem value="=">Equals</SelectItem>
                    <SelectItem value="!=">Not equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={newCondition.value}
                  onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                />
                <Button type="button" onClick={addCondition}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {conditions.map((condition: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <Badge variant="outline">
                      {condition.field} {condition.operator} {condition.value}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
              <CardDescription>
                Define what should happen when this rule triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select
                  value={newAction.type}
                  onValueChange={(value) => setNewAction({ ...newAction, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_notification">Send Notification</SelectItem>
                    <SelectItem value="webhook">Call Webhook</SelectItem>
                    <SelectItem value="email">Send Email</SelectItem>
                    <SelectItem value="create_ticket">Create Ticket</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Configuration (JSON)"
                  value={JSON.stringify(newAction.config)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value || '{}');
                      setNewAction({ ...newAction, config });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
                <Button type="button" onClick={addAction}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {formData.actions.map((action: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <Badge variant="outline">
                      {action.type}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : rule
                ? 'Update Rule'
                : 'Create Rule'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
