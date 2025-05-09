
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TestTube2 } from "lucide-react";
import { Control, UseFormGetValues } from "react-hook-form";
import { NotificationSettings } from "@/services/notifications";
import TelegramSetupGuide from "./TelegramSetupGuide";

interface TelegramNotificationsProps {
  control: Control<NotificationSettings>;
  getValues: UseFormGetValues<NotificationSettings>;
  isTesting: boolean;
  isLoading: boolean;
  onTestClick: () => void;
}

const TelegramNotifications = ({ 
  control, 
  getValues, 
  isTesting, 
  isLoading, 
  onTestClick 
}: TelegramNotificationsProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium">Telegram Notifications</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Configure a Telegram bot to receive instant notifications.
      </p>
      
      <TelegramSetupGuide />
      
      <div className="mt-4 space-y-4">
        <FormField
          control={control}
          name="telegram_bot_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bot Token</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                The API token provided by BotFather.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="telegram_chat_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chat ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456789"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Your Telegram chat ID or group chat ID.
              </FormDescription>
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="outline"
          onClick={onTestClick}
          disabled={isTesting || isLoading || 
            !getValues("telegram_bot_token") || 
            !getValues("telegram_chat_id")}
          className="mt-2"
        >
          {isTesting ? (
            <>Testing...</>
          ) : (
            <>
              <TestTube2 className="mr-2 h-4 w-4" />
              Test Telegram Notification
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TelegramNotifications;
