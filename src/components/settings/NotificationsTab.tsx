
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const NotificationsTab = () => {
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Notification settings saved", {
      description: "Your notification preferences have been updated",
    });
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
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="notify-offline" defaultChecked />
              <Label htmlFor="notify-offline">Device offline notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="notify-battery" defaultChecked />
              <Label htmlFor="notify-battery">Low battery notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="notify-security" />
              <Label htmlFor="notify-security">Security issue notifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="notify-new-device" defaultChecked />
              <Label htmlFor="notify-new-device">New device detected</Label>
            </div>
          </div>
          
          <div className="pt-4">
            <Label htmlFor="email-notifications" className="mb-2 block">Email Notifications</Label>
            <Input id="email-notifications" type="email" placeholder="admin@example.com" />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to disable email notifications.
            </p>
          </div>
          
          <Button type="submit">Save Notification Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
