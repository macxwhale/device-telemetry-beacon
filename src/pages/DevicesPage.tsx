
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { DeviceFilters } from "@/components/dashboard/DeviceFilters";
import { DeviceStats } from "@/components/dashboard/DeviceStats";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { DeviceMonitorButton } from "@/components/dashboard/DeviceMonitorButton";
import { VirtualizedDeviceGrid } from "@/components/dashboard/VirtualizedDeviceGrid";
import { useDevicesQuery } from "@/hooks/useDevicesQuery";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { DeviceStatus } from "@/types/telemetry";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

const DevicesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  const { refresh } = useRealTimeUpdates();

  useEffect(() => {
    document.title = "Devices - Device Telemetry";
  }, []);

  // Filter devices based on search and status
  const filteredDevices = devices.filter((device: DeviceStatus) => {
    const matchesSearch = device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "online" && device.isOnline) ||
                         (statusFilter === "offline" && !device.isOnline);
    
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    refresh();
    refetch();
  };

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
            <DeviceMonitorButton />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <DeviceStats devices={devices} />

        <DeviceFilters devices={devices} />

        {showBulkActions && (
          <BulkActions 
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
