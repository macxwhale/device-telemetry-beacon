
import { useState } from 'react';

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

export const useNotificationSettings = (initialSettings?: Partial<NotificationConfig>) => {
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
    ...initialSettings
  });

  const updateSetting = (key: keyof NotificationConfig, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: keyof NotificationConfig, value: boolean) => {
    updateSetting(key, value);
  };

  const updateThreshold = (key: keyof NotificationConfig, value: number) => {
    updateSetting(key, value);
  };

  const updateInput = (key: keyof NotificationConfig, value: string) => {
    updateSetting(key, value);
  };

  return {
    settings,
    updateSetting,
    toggleSetting,
    updateThreshold,
    updateInput
  };
};
