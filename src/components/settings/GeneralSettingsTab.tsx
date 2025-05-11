
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDevices } from "@/contexts/DeviceContext";

const GeneralSettingsTab = () => {
  const [systemName, setSystemName] = useState("Device Telemetry Beacon");
  const [offlineThreshold, setOfflineThreshold] = useState("15");
  const [dataRetention, setDataRetention] = useState("30");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { updateOfflineThreshold } = useDevices();

  // Load stored settings from localStorage on component mount
  useEffect(() => {
    const storedSystemName = localStorage.getItem("systemName");
    const storedOfflineThreshold = localStorage.getItem("offlineThreshold");
    const storedDataRetention = localStorage.getItem("dataRetention");
    const storedAutoRefresh = localStorage.getItem("autoRefresh");

    if (storedSystemName) setSystemName(storedSystemName);
    if (storedOfflineThreshold) setOfflineThreshold(storedOfflineThreshold);
    if (storedDataRetention) setDataRetention(storedDataRetention);
    if (storedAutoRefresh !== null) setAutoRefresh(storedAutoRefresh === "true");
    
    // Update the device context with the current offline threshold
    if (storedOfflineThreshold) {
      updateOfflineThreshold(parseInt(storedOfflineThreshold, 10));
    }
  }, [updateOfflineThreshold]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save settings to localStorage
    localStorage.setItem("systemName", systemName);
    localStorage.setItem("offlineThreshold", offlineThreshold);
    localStorage.setItem("dataRetention", dataRetention);
    localStorage.setItem("autoRefresh", autoRefresh.toString());

    // Update the device context with the new offline threshold
    updateOfflineThreshold(parseInt(offlineThreshold, 10));

    // Show success message
    toast.success("Settings saved", {
      description: "Your general settings have been updated",
    });

    // Update document title with new system name
    document.title = systemName + " - Settings";
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
            <Input 
              id="system-name" 
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="offline-threshold">Offline Threshold (minutes)</Label>
            <Input 
              id="offline-threshold" 
              type="number" 
              value={offlineThreshold}
              onChange={(e) => setOfflineThreshold(e.target.value)}
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
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              min="1"
              max="365"
            />
            <p className="text-xs text-muted-foreground">
              Number of days to retain historical telemetry data.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="auto-refresh" 
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">Enable auto-refresh (1 minute)</Label>
          </div>
          
          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsTab;
