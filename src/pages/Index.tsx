import { useEffect, memo, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { DeviceStats } from "@/components/dashboard/DeviceStats";
import { DeviceOverview } from "@/components/dashboard/DeviceOverview";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { DeviceStatusChecker } from "@/components/dashboard/DeviceStatusChecker";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { SystemInfoCard } from "@/components/dashboard/SystemInfoCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDevicesQuery } from "@/hooks/useDevicesQuery";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { ErrorMessage } from "@/components/ErrorMessage";
import { DeviceStatus } from "@/types/telemetry";

const Index = memo(() => {
  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  const { refresh } = useRealTimeUpdates({ enabled: !isLoading });
  
  const handleRefresh = useCallback(async () => {
    console.log("🔄 Dashboard refresh button clicked");
    try {
      // Force immediate refresh without rate limiting
      refresh();
      await refetch();
      console.log("✅ Dashboard refresh completed");
    } catch (error) {
      console.error("❌ Dashboard refresh failed:", error);
    }
  }, [refetch, refresh]);
  
  useEffect(() => {
    document.title = "Device Telemetry Dashboard";
  }, []);
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Device Telemetry Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {error ? (
        <ErrorMessage 
          message="Failed to load dashboard data" 
          onRetry={handleRefresh} 
        />
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent devices={devices} />
      )}
    </Layout>
  );
});

Index.displayName = 'Index';

// Memoized dashboard content to prevent unnecessary re-renders
const DashboardContent = memo(({ devices }: { devices: DeviceStatus[] }) => (
  <div className="space-y-6">
    {/* Enhanced Device Status Monitor */}
    <DeviceStatusChecker />
    
    <DeviceStats devices={devices} />
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <DeviceOverview devices={devices} />
      <SystemInfoCard />
    </div>
    
    <RecentDevices devices={devices} />
  </div>
));

DashboardContent.displayName = 'DashboardContent';

const RecentDevices = memo(({ devices }: { devices: DeviceStatus[] }) => {
  const recentDevices = devices.slice(0, 4);
  
  return (
    <div>
      <h2 className="text-lg font-medium mb-3">Recent Devices</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recentDevices.map(device => (
          <DeviceStatusCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
});

RecentDevices.displayName = 'RecentDevices';

export default Index;
