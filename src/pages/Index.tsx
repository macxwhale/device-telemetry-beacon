
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DeviceStats } from "@/components/dashboard/DeviceStats";
import { DeviceOverview } from "@/components/dashboard/DeviceOverview";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { SystemInfoCard } from "@/components/dashboard/SystemInfoCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDevicesQuery } from "@/hooks/useDevicesQuery";
import { ErrorMessage } from "@/components/ErrorMessage";

const Index = () => {
  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  
  useEffect(() => {
    document.title = "Device Telemetry Dashboard";
  }, []);
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Device Telemetry Dashboard</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {error ? (
        <ErrorMessage 
          message="Failed to load dashboard data" 
          onRetry={() => refetch()} 
        />
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent devices={devices} />
      )}
    </Layout>
  );
};

// Extracted component to keep main component under 50 lines
const DashboardContent = ({ devices }) => (
  <div className="space-y-6">
    <DeviceStats devices={devices} />
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <DeviceOverview devices={devices} />
      <SystemInfoCard />
    </div>
    
    <RecentDevices devices={devices} />
  </div>
);

// Recent devices component
const RecentDevices = ({ devices }) => (
  <div>
    <h2 className="text-lg font-medium mb-3">Recent Devices</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {devices.slice(0, 4).map(device => (
        <DeviceStatusCard key={device.id} device={device} />
      ))}
    </div>
  </div>
);

export default Index;
