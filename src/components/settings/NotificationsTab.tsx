
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Send, TestTube2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getNotificationSettings,
  saveNotificationSettings,
  sendTestNotification,
  NotificationSettings,
} from "@/services/notificationService";

interface ExtendedNotificationSettings extends NotificationSettings {
  battery_threshold?: number;
  offline_threshold?: number;
}

const NotificationsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const form = useForm<ExtendedNotificationSettings>({
    defaultValues: {
      notify_device_offline: true,
      notify_low_battery: true,
      notify_security_issues: false,
      notify_new_device: true,
      email_notifications: "",
      telegram_bot_token: "",
      telegram_chat_id: "",
      battery_threshold: 20,
      offline_threshold: 15,
    },
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getNotificationSettings();
        if (settings) {
          // Extract thresholds from additional_settings
          const batteryThreshold = settings.additional_settings?.battery_threshold || 20;
          const offlineThreshold = settings.additional_settings?.offline_threshold || 15;
          
          form.reset({
            ...settings,
            battery_threshold: batteryThreshold,
            offline_threshold: offlineThreshold,
          });
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [form]);

  const handleSaveNotifications = async (data: ExtendedNotificationSettings) => {
    setIsLoading(true);
    try {
      // Prepare settings with thresholds in additional_settings
      const settingsToSave: NotificationSettings = {
        ...data,
        additional_settings: {
          battery_threshold: data.battery_threshold || 20,
          offline_threshold: data.offline_threshold || 15,
        },
      };
      
      // Remove the threshold fields from the main object
      delete (settingsToSave as any).battery_threshold;
      delete (settingsToSave as any).offline_threshold;
      
      await saveNotificationSettings(settingsToSave);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestTelegramNotification = async () => {
    const botToken = form.getValues("telegram_bot_token");
    const chatId = form.getValues("telegram_chat_id");
    
    if (!botToken || !chatId) {
      toast.error("Telegram bot token and chat ID are required for testing");
      return;
    }
    
    setIsTesting(true);
    try {
      await sendTestNotification(botToken, chatId);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure when and how you receive alerts about devices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveNotifications)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which events trigger notifications.
              </p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notify_device_offline"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Device offline notifications</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_low_battery"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Low battery notifications</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_security_issues"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Security issue notifications</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_new_device"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">New device detected</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium">Alert Thresholds</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure when alerts should be triggered.
              </p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="battery_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Battery Alert Threshold (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="5"
                          max="50"
                          placeholder="20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                        />
                      </FormControl>
                      <FormDescription>
                        Alert when battery level drops below this percentage.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offline_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offline Alert Threshold (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          placeholder="15"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                        />
                      </FormControl>
                      <FormDescription>
                        Alert when device hasn't been seen for this many minutes.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium">Email Notifications</h3>
              <FormField
                control={form.control}
                name="email_notifications"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to disable email notifications.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium">Telegram Notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure a Telegram bot to receive instant notifications.
              </p>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How to create a Telegram bot</AlertTitle>
                <AlertDescription>
                  1. Open Telegram and search for <strong>@BotFather</strong><br />
                  2. Send the command <code>/newbot</code> and follow instructions<br />
                  3. Copy the bot token provided by BotFather<br />
                  4. Start a chat with your bot and get the Chat ID from <strong>@userinfobot</strong>
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  onClick={handleTestTelegramNotification}
                  disabled={isTesting || isLoading || 
                    !form.getValues("telegram_bot_token") || 
                    !form.getValues("telegram_chat_id")}
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

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
