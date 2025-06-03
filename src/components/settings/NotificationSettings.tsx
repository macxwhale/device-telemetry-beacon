
import { FC, memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { AlertTypesSection } from './notifications/AlertTypesSection';
import { DeliveryMethodsSection } from './notifications/DeliveryMethodsSection';
import { ThresholdSection } from './notifications/ThresholdSection';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

interface NotificationSettingsProps {
  onSave?: (settings: any) => void;
}

export const NotificationSettings: FC<NotificationSettingsProps> = memo(({ onSave }) => {
  const { settings, toggleSetting, updateThreshold, updateInput } = useNotificationSettings();
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

  return (
    <div className="space-y-6">
      <AlertTypesSection
        deviceOffline={settings.deviceOffline}
        lowBattery={settings.lowBattery}
        securityIssues={settings.securityIssues}
        newDevice={settings.newDevice}
        batteryThreshold={settings.batteryThreshold}
        offlineThreshold={settings.offlineThreshold}
        onToggle={toggleSetting}
      />

      <DeliveryMethodsSection
        emailNotifications={settings.emailNotifications}
        telegramNotifications={settings.telegramNotifications}
        emailAddress={settings.emailAddress}
        telegramBotToken={settings.telegramBotToken}
        telegramChatId={settings.telegramChatId}
        onToggle={toggleSetting}
        onInputChange={updateInput}
      />

      <ThresholdSection
        batteryThreshold={settings.batteryThreshold}
        offlineThreshold={settings.offlineThreshold}
        onThresholdChange={updateThreshold}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
});

NotificationSettings.displayName = 'NotificationSettings';
