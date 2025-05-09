
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  sendTelegramTestNotification,
} from "@/services/notifications";

// Import the refactored components
import NotificationPreferences from "./notifications/NotificationPreferences";
import EmailNotifications from "./notifications/EmailNotifications";
import TelegramNotifications from "./notifications/TelegramNotifications";

const NotificationsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const form = useForm<NotificationSettings>({
    defaultValues: {
      notify_device_offline: true,
      notify_low_battery: true,
      notify_security_issues: false,
      notify_new_device: true,
      email_notifications: "",
      telegram_bot_token: "",
      telegram_chat_id: "",
    },
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getNotificationSettings();
        if (settings) {
          form.reset(settings);
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [form]);

  const handleSaveNotifications = async (data: NotificationSettings) => {
    setIsLoading(true);
    try {
      await saveNotificationSettings(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestTelegramNotification = async () => {
    const botToken = form.getValues("telegram_bot_token");
    const chatId = form.getValues("telegram_chat_id");
    
    if (!botToken || !chatId) {
      return;
    }
    
    setIsTesting(true);
    try {
      await sendTelegramTestNotification(botToken, chatId);
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
            <NotificationPreferences control={form.control} />
            
            <Separator />
            
            <EmailNotifications control={form.control} />
            
            <Separator />
            
            <TelegramNotifications 
              control={form.control}
              getValues={form.getValues}
              isTesting={isTesting}
              isLoading={isLoading}
              onTestClick={handleTestTelegramNotification}
            />

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
