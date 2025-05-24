
import { FC, memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Shield, Battery, Wifi } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  onSave?: (settings: NotificationConfig) => void;
}

interface NotificationConfig {
  deviceOffline: boolean;
  lowBattery: boolean;
  securityIssues: boolean;
  newDevice: boolean;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  emailAddress: string;
  telegramBotToken: string;
  telegramChatId: string;
  batteryThreshold: number;
  offlineThreshold: number;
}

export const NotificationSettings: FC<NotificationSettingsProps> = memo(({ onSave }) => {
  const [settings, setSettings] = useState<NotificationConfig>({
    deviceOffline: true,
    lowBattery: true,
    securityIssues: false,
    newDevice: true,
    emailNotifications: false,
    telegramNotifications: false,
    emailAddress: '',
    telegramBotToken: '',
    telegramChatId: '',
    batteryThreshold: 20,
    offlineThreshold: 5,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        onSave(settings);
      }
      toast({
        title: "Settings Saved",
        description: "Notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationConfig, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Alert Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-4 w-4 text-red-500" />
              <div>
                <Label>Device Offline</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when devices go offline for more than {settings.offlineThreshold} minutes
                </p>
              </div>
            </div>
            <Switch
              checked={settings.deviceOffline}
              onCheckedChange={(checked) => updateSetting('deviceOffline', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className="h-4 w-4 text-yellow-500" />
              <div>
                <Label>Low Battery</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when battery drops below {settings.batteryThreshold}%
                </p>
              </div>
            </div>
            <Switch
              checked={settings.lowBattery}
              onCheckedChange={(checked) => updateSetting('lowBattery', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-orange-500" />
              <div>
                <Label>Security Issues</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for rooted devices or security concerns
                </p>
              </div>
            </div>
            <Switch
              checked={settings.securityIssues}
              onCheckedChange={(checked) => updateSetting('securityIssues', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-blue-500" />
              <div>
                <Label>New Device</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when new devices are registered
                </p>
              </div>
            </div>
            <Switch
              checked={settings.newDevice}
              onCheckedChange={(checked) => updateSetting('newDevice', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <Label>Email Notifications</Label>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>
            {settings.emailNotifications && (
              <div className="ml-7 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="notifications@example.com"
                  value={settings.emailAddress}
                  onChange={(e) => updateSetting('emailAddress', e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Telegram Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4" />
                <Label>Telegram Notifications</Label>
              </div>
              <Switch
                checked={settings.telegramNotifications}
                onCheckedChange={(checked) => updateSetting('telegramNotifications', checked)}
              />
            </div>
            {settings.telegramNotifications && (
              <div className="ml-7 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="telegram-token">Bot Token</Label>
                  <Input
                    id="telegram-token"
                    type="password"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={settings.telegramBotToken}
                    onChange={(e) => updateSetting('telegramBotToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram-chat">Chat ID</Label>
                  <Input
                    id="telegram-chat"
                    placeholder="-1001234567890"
                    value={settings.telegramChatId}
                    onChange={(e) => updateSetting('telegramChatId', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="battery-threshold">
              Battery Alert Threshold ({settings.batteryThreshold}%)
            </Label>
            <Input
              id="battery-threshold"
              type="range"
              min="5"
              max="50"
              value={settings.batteryThreshold}
              onChange={(e) => updateSetting('batteryThreshold', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offline-threshold">
              Offline Alert Threshold ({settings.offlineThreshold} minutes)
            </Label>
            <Input
              id="offline-threshold"
              type="range"
              min="1"
              max="60"
              value={settings.offlineThreshold}
              onChange={(e) => updateSetting('offlineThreshold', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
});

NotificationSettings.displayName = 'NotificationSettings';
