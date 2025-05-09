
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { NotificationSettings } from "@/services/notificationService";

interface NotificationPreferencesProps {
  control: Control<NotificationSettings>;
}

const NotificationPreferences = ({ control }: NotificationPreferencesProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium">Notification Preferences</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Choose which events trigger notifications.
      </p>
      <div className="space-y-4">
        <FormField
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
  );
};

export default NotificationPreferences;
