
import { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { DeviceFilters } from "@/components/dashboard/DeviceFilters";
import { DeviceStats } from "@/components/dashboard/DeviceStats";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { DeviceMonitorButton } from "@/components/dashboard/DeviceMonitorButton";
import { VirtualizedDeviceGrid } from "@/components/dashboard/VirtualizedDeviceGrid";
import { useDevicesQuery } from "@/hooks/useDevicesQuery";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { DeviceGroupManager } from "@/components/groups/DeviceGroupManager";

const DevicesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  const { refresh } = useRealTimeUpdates();
  
  const { filteredDevices, stats } = useDeviceStatus({
    devices,
    statusFilter,
    searchQuery
  });

  useEffect(() => {
    document.title = "Devices - Device Telemetry";
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log("Devices page refresh button clicked");
    try {
      await refetch();
      refresh();
      console.log("Devices page refresh completed");
    } catch (error) {
      console.error("Devices page refresh failed:", error);
    }
  }, [refetch, refresh]);

  const handleSelectionChange = (deviceIds: string[]) => {
    setSelectedDevices(deviceIds);
    setShowBulkActions(deviceIds.length > 0);
  };

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">Error loading devices: {error.message}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Devices</h1>
            <p className="text-muted-foreground">
              Monitor and manage your connected devices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DeviceMonitorButton variant="default" size="sm" />
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <DeviceStats devices={devices} />

        <DeviceGroupManager />

        <DeviceFilters 
          devices={devices}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {showBulkActions && (
          <BulkActions 
            devices={filteredDevices}
            selectedDevices={selectedDevices}
            onSelectionChange={setSelectedDevices}
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <VirtualizedDeviceGrid
            devices={filteredDevices}
            selectedDevices={selectedDevices}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>
    </Layout>
  );
};

export default DevicesPage;
