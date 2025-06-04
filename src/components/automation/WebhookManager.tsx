
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ExternalLink, Trash2, TestTube } from 'lucide-react';
import { useWebhookEndpoints, useCreateWebhookEndpoint, useDeleteWebhookEndpoint, useTestWebhook } from '@/hooks/useWebhooks';
import { WebhookEndpoint } from '@/types/automation';

export const WebhookManager = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    enabled: true
  });

  const { data: webhooks = [], isLoading } = useWebhookEndpoints();
  const createMutation = useCreateWebhookEndpoint();
  const deleteMutation = useDeleteWebhookEndpoint();
  const testMutation = useTestWebhook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        ...formData,
        created_by: 'current-user' // This would come from auth context
      });
      setShowCreateDialog(false);
      setFormData({ name: '', url: '', events: [], enabled: true });
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleTestWebhook = async (webhook: WebhookEndpoint) => {
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Device Telemetry Dashboard'
      }
    };

    await testMutation.mutateAsync({
      url: webhook.url,
      payload: testPayload
    });
  };

  const availableEvents = [
    'device.connected',
    'device.disconnected',
    'device.low_battery',
    'device.security_alert',
    'automation.triggered',
    'group.created',
    'group.updated'
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Endpoints</CardTitle>
            <CardDescription>
              Manage webhook endpoints for external integrations
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook Endpoint</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter webhook name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableEvents.map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event}
                          checked={formData.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                events: [...formData.events, event]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                events: formData.events.filter(e => e !== event)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={event} className="text-sm">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhook-enabled"
                    checked={formData.enabled}
                    onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
                  />
                  <Label htmlFor="webhook-enabled">Enable webhook</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <Badge variant={webhook.enabled ? "default" : "secondary"}>
                    {webhook.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{webhook.url}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {webhook.events.slice(0, 3).map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                  {webhook.events.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{webhook.events.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestWebhook(webhook)}
                  disabled={testMutation.isPending}
                >
                  <TestTube className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(webhook.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(webhook.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No webhook endpoints configured yet. Click "Add Webhook" to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
