
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DeviceStats } from "@/components/dashboard/DeviceStats";
import { DeviceOverview } from "@/components/dashboard/DeviceOverview";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { useDevices } from "@/contexts/DeviceContext";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { SystemInfoCard } from "@/components/dashboard/SystemInfoCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Index = () => {
  const { devices, loading, refreshDevices } = useDevices();
  
  useEffect(() => {
    document.title = "Device Telemetry Dashboard";
  }, []);
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Device Telemetry Dashboard</h1>
        <Button variant="outline" size="sm" onClick={refreshDevices}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <DeviceStats devices={devices} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DeviceOverview devices={devices} />
            <SystemInfoCard />
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-3">Recent Devices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {devices.slice(0, 4).map(device => (
                <DeviceStatusCard key={device.id} device={device} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;
