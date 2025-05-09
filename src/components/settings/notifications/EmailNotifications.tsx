
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { NotificationSettings } from "@/services/notifications";

interface EmailNotificationsProps {
  control: Control<NotificationSettings>;
}

const EmailNotifications = ({ control }: EmailNotificationsProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium">Email Notifications</h3>
      <FormField
        control={control}
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
  );
};

export default EmailNotifications;
