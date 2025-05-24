
import { useState, useEffect, memo } from 'react';
import { Layout } from '@/components/Layout';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Shield, 
  Database, 
  Key, 
  Settings,
  RefreshCw,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdvancedSettingsPage = memo(() => {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    retentionDays: 90,
    maxDevices: 1000,
    enableLogs: true,
    logLevel: 'info',
    apiKey: '',
    encryptionEnabled: true,
    backupEnabled: false,
    compressionEnabled: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Advanced Settings - Device Telemetry";
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings Saved",
        description: "All settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telemetry-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Settings have been exported successfully.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Advanced Settings</h1>
            <p className="text-muted-foreground">
              Configure advanced system settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Save All
            </Button>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Enter your API key"
                        value={settings.apiKey}
                        onChange={(e) => updateSetting('apiKey', e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm">
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Encryption</Label>
                      <p className="text-sm text-muted-foreground">
                        Encrypt all data transmission and storage
                      </p>
                    </div>
                    <Switch
                      checked={settings.encryptionEnabled}
                      onCheckedChange={(checked) => updateSetting('encryptionEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Allowed IP Addresses</Label>
                    <Input placeholder="192.168.1.0/24, 10.0.0.0/8" />
                    <p className="text-sm text-muted-foreground">
                      Comma-separated list of allowed IP ranges
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" value="60" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Retention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="retention">
                      Data Retention Period ({settings.retentionDays} days)
                    </Label>
                    <Input
                      id="retention"
                      type="range"
                      min="30"
                      max="365"
                      value={settings.retentionDays}
                      onChange={(e) => updateSetting('retentionDays', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>30 days</span>
                      <span>1 year</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-devices">
                      Maximum Devices ({settings.maxDevices})
                    </Label>
                    <Input
                      id="max-devices"
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={settings.maxDevices}
                      onChange={(e) => updateSetting('maxDevices', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Data Compression</Label>
                      <p className="text-sm text-muted-foreground">
                        Compress stored telemetry data to save space
                      </p>
                    </div>
                    <Switch
                      checked={settings.compressionEnabled}
                      onCheckedChange={(checked) => updateSetting('compressionEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatic Backups</Label>
                      <p className="text-sm text-muted-foreground">
                        Create daily backups of all data
                      </p>
                    </div>
                    <Switch
                      checked={settings.backupEnabled}
                      onCheckedChange={(checked) => updateSetting('backupEnabled', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-red-600">Danger Zone</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete all telemetry data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Refresh</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh device data
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoRefresh}
                      onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                    />
                  </div>

                  {settings.autoRefresh && (
                    <div className="space-y-2">
                      <Label htmlFor="refresh-interval">
                        Refresh Interval ({settings.refreshInterval} seconds)
                      </Label>
                      <Input
                        id="refresh-interval"
                        type="range"
                        min="10"
                        max="300"
                        value={settings.refreshInterval}
                        onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logging</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log system events and errors
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableLogs}
                      onCheckedChange={(checked) => updateSetting('enableLogs', checked)}
                    />
                  </div>

                  {settings.enableLogs && (
                    <div className="space-y-2">
                      <Label>Log Level</Label>
                      <div className="flex gap-2">
                        {['debug', 'info', 'warn', 'error'].map(level => (
                          <Badge
                            key={level}
                            variant={settings.logLevel === level ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => updateSetting('logLevel', level)}
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Application Version</Label>
                      <p className="text-muted-foreground">v2.1.0</p>
                    </div>
                    <div>
                      <Label>Database Version</Label>
                      <p className="text-muted-foreground">PostgreSQL 15.2</p>
                    </div>
                    <div>
                      <Label>API Version</Label>
                      <p className="text-muted-foreground">v1.0</p>
                    </div>
                    <div>
                      <Label>Last Updated</Label>
                      <p className="text-muted-foreground">2024-01-15</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
});

AdvancedSettingsPage.displayName = 'AdvancedSettingsPage';

export default AdvancedSettingsPage;
