
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettingsTab from "@/components/settings/GeneralSettingsTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import DatabaseTab from "@/components/settings/DatabaseTab";
import ApiTab from "@/components/settings/ApiTab";

const SettingsPage = () => {
  useEffect(() => {
    // Page title
    document.title = "Settings - Device Telemetry";
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        
        <TabsContent value="database">
          <DatabaseTab />
        </TabsContent>
        
        <TabsContent value="api">
          <ApiTab />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default SettingsPage;
