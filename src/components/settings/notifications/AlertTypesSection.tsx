
import { FC, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Wifi, Battery, Shield } from 'lucide-react';

interface AlertTypesSectionProps {
  deviceOffline: boolean;
  lowBattery: boolean;
  securityIssues: boolean;
  newDevice: boolean;
  batteryThreshold: number;
  offlineThreshold: number;
  onToggle: (key: string, value: boolean) => void;
}

export const AlertTypesSection: FC<AlertTypesSectionProps> = memo(({
  deviceOffline,
  lowBattery,
  securityIssues,
  newDevice,
  batteryThreshold,
  offlineThreshold,
  onToggle
}) => {
  return (
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
                Alert when devices go offline for more than {offlineThreshold} minutes
              </p>
            </div>
          </div>
          <Switch
            checked={deviceOffline}
            onCheckedChange={(checked) => onToggle('deviceOffline', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Battery className="h-4 w-4 text-yellow-500" />
            <div>
              <Label>Low Battery</Label>
              <p className="text-sm text-muted-foreground">
                Alert when battery drops below {batteryThreshold}%
              </p>
            </div>
          </div>
          <Switch
            checked={lowBattery}
            onCheckedChange={(checked) => onToggle('lowBattery', checked)}
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
            checked={securityIssues}
            onCheckedChange={(checked) => onToggle('securityIssues', checked)}
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
            checked={newDevice}
            onCheckedChange={(checked) => onToggle('newDevice', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
});

AlertTypesSection.displayName = 'AlertTypesSection';
