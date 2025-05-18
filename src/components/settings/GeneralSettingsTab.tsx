
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { GeneralSettings, getGeneralSettings, saveGeneralSettings } from "@/services/settingsService";
import { Loader2 } from "lucide-react";

const GeneralSettingsTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<GeneralSettings>({
    defaultValues: {
      system_name: "Device Telemetry Beacon",
      offline_threshold: 15,
      data_retention: 30,
      auto_refresh: true
    },
  });
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getGeneralSettings();
        if (settings) {
          form.reset(settings);
        }
      } catch (error) {
        console.error("Error loading general settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [form]);

  const handleSaveGeneral = async (data: GeneralSettings) => {
    setIsLoading(true);
    try {
      await saveGeneralSettings(data);
    } finally {
      setIsLoading(false);
    }
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveGeneral)} className="space-y-4">
            <FormField
              control={form.control}
              name="system_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>System Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="offline_threshold"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Offline Threshold (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Time in minutes after which a device is marked as offline if no data is received.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="data_retention"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Data Retention Period (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of days to retain historical telemetry data.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="auto_refresh"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 pt-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Enable auto-refresh (1 minute)</FormLabel>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsTab;
