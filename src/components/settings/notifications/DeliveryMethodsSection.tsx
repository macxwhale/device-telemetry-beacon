
import { FC, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, MessageSquare } from 'lucide-react';

interface DeliveryMethodsSectionProps {
  emailNotifications: boolean;
  telegramNotifications: boolean;
  emailAddress: string;
  telegramBotToken: string;
  telegramChatId: string;
  onToggle: (key: string, value: boolean) => void;
  onInputChange: (key: string, value: string) => void;
}

export const DeliveryMethodsSection: FC<DeliveryMethodsSectionProps> = memo(({
  emailNotifications,
  telegramNotifications,
  emailAddress,
  telegramBotToken,
  telegramChatId,
  onToggle,
  onInputChange
}) => {
  return (
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
              checked={emailNotifications}
              onCheckedChange={(checked) => onToggle('emailNotifications', checked)}
            />
          </div>
          {emailNotifications && (
            <div className="ml-7 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="notifications@example.com"
                value={emailAddress}
                onChange={(e) => onInputChange('emailAddress', e.target.value)}
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
              checked={telegramNotifications}
              onCheckedChange={(checked) => onToggle('telegramNotifications', checked)}
            />
          </div>
          {telegramNotifications && (
            <div className="ml-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-token">Bot Token</Label>
                <Input
                  id="telegram-token"
                  type="password"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={telegramBotToken}
                  onChange={(e) => onInputChange('telegramBotToken', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram-chat">Chat ID</Label>
                <Input
                  id="telegram-chat"
                  placeholder="-1001234567890"
                  value={telegramChatId}
                  onChange={(e) => onInputChange('telegramChatId', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

DeliveryMethodsSection.displayName = 'DeliveryMethodsSection';
