
import { useEffect, useState, useCallback, memo } from "react";
import { Layout } from "@/components/Layout";
import { VirtualizedDeviceGrid } from "@/components/dashboard/VirtualizedDeviceGrid";
import { DeviceFilters } from "@/components/dashboard/DeviceFilters";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { DeviceCardSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDevicesQuery } from "@/hooks/useDevicesQuery";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { ErrorMessage } from "@/components/ErrorMessage";
import { FilterProvider, useFilter } from "@/contexts/FilterContext";
import { toast } from "@/hooks/use-toast";

const DevicesPageContent = memo(() => {
  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  const { filteredDevices, setDevices } = useFilter();
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const { refresh } = useRealTimeUpdates({ enabled: !isLoading });

  // Update filter context when devices change
  useEffect(() => {
    setDevices(devices);
  }, [devices, setDevices]);
  
  // Memoize the refresh callback
  const handleRefresh = useCallback(() => {
    refetch();
    refresh();
  }, [refetch, refresh]);

  const handleBulkDelete = useCallback((deviceIds: string[]) => {
    // This would integrate with your delete mutation
    toast({
      title: "Bulk Delete",
      description: `Would delete ${deviceIds.length} devices`,
    });
    console.log('Bulk delete:', deviceIds);
  }, []);

  const handleBulkExport = useCallback((deviceIds: string[]) => {
    const selectedDeviceData = devices.filter(device => deviceIds.includes(device.id));
    const jsonData = JSON.stringify(selectedDeviceData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devices-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Exported ${deviceIds.length} devices`,
    });
  }, [devices]);
  
  useEffect(() => {
    document.title = "Devices - Device Telemetry";
  }, []);
  
  return (
    <Layout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {filteredDevices.length} of {devices.length} devices
            </p>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {error ? (
        <ErrorMessage 
          message="Failed to load devices" 
          onRetry={handleRefresh} 
        />
      ) : isLoading ? (
        <div className="space-y-6">
          {/* Loading skeleton for filters */}
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          
          <DeviceGrid>
            {Array.from({ length: 8 }).map((_, i) => (
              <DeviceCardSkeleton key={i} />
            ))}
          </DeviceGrid>
        </div>
      ) : (
        <div className="space-y-6">
          <DeviceFilters devices={devices} />
          
          <BulkActions
            devices={filteredDevices}
            selectedDevices={selectedDevices}
            onSelectionChange={setSelectedDevices}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
          />

          {filteredDevices.length === 0 ? (
            <EmptyState />
          ) : (
            <VirtualizedDeviceGrid 
              devices={filteredDevices}
              selectedDevices={selectedDevices}
              onSelectionChange={setSelectedDevices}
            />
          )}
        </div>
      )}
    </Layout>
  );
});

DevicesPageContent.displayName = 'DevicesPageContent';

const DevicesPage = memo(() => {
  return (
    <FilterProvider>
      <DevicesPageContent />
    </FilterProvider>
  );
});

DevicesPage.displayName = 'DevicesPage';

// Memoized components to prevent unnecessary re-renders
const DeviceGrid = memo(({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {children}
  </div>
));

DeviceGrid.displayName = 'DeviceGrid';

const EmptyState = memo(() => (
  <div className="text-center py-12">
    <p className="text-muted-foreground mb-2">No devices found with current filters</p>
    <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
  </div>
));

EmptyState.displayName = 'EmptyState';

export default DevicesPage;
