
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const GeneralSettingsTab = () => {
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved", {
      description: "Your general settings have been updated",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure general system settings for the telemetry monitoring tool.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-name">System Name</Label>
            <Input id="system-name" defaultValue="Device Telemetry Beacon" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="offline-threshold">Offline Threshold (minutes)</Label>
            <Input 
              id="offline-threshold" 
              type="number" 
              defaultValue="15" 
              min="1"
              max="60"
            />
            <p className="text-xs text-muted-foreground">
              Time in minutes after which a device is marked as offline if no data is received.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data-retention">Data Retention Period (days)</Label>
            <Input 
              id="data-retention" 
              type="number" 
              defaultValue="30" 
              min="1"
              max="365"
            />
            <p className="text-xs text-muted-foreground">
              Number of days to retain historical telemetry data.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="auto-refresh" defaultChecked />
            <Label htmlFor="auto-refresh">Enable auto-refresh (1 minute)</Label>
          </div>
          
          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsTab;
