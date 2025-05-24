
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Layout } from "@/components/Layout";
import { VirtualizedDeviceGrid } from "@/components/dashboard/VirtualizedDeviceGrid";
import { DeviceCardSkeleton } from "@/components/ui/skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { useDevicesQuery } from "@/hooks/useDevicesQuery";
import { ErrorMessage } from "@/components/ErrorMessage";

const DevicesPage = memo(() => {
  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Memoize the refresh callback
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoize the search handler with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Clear search callback
  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);
  
  useEffect(() => {
    document.title = "Devices - Device Telemetry";
  }, []);
  
  // Memoize filtered devices count for display
  const filteredCount = useMemo(() => {
    if (!searchTerm) return devices.length;
    const term = searchTerm.toLowerCase();
    return devices.filter(device => 
      device.name.toLowerCase().includes(term) ||
      device.model.toLowerCase().includes(term) ||
      device.manufacturer.toLowerCase().includes(term)
    ).length;
  }, [devices, searchTerm]);
  
  return (
    <Layout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `${filteredCount} of ${devices.length} devices` : `${devices.length} devices`}
            </p>
          )}
        </div>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {error ? (
        <ErrorMessage 
          message="Failed to load devices" 
          onRetry={handleRefresh} 
        />
      ) : isLoading ? (
        <DeviceGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <DeviceCardSkeleton key={i} />
          ))}
        </DeviceGrid>
      ) : filteredCount === 0 ? (
        <EmptyState searchTerm={searchTerm} clearSearch={clearSearch} />
      ) : (
        <VirtualizedDeviceGrid devices={devices} searchTerm={searchTerm} />
      )}
    </Layout>
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

const EmptyState = memo(({ searchTerm, clearSearch }: { searchTerm: string, clearSearch: () => void }) => (
  <div className="text-center py-12">
    <p className="text-muted-foreground mb-2">No devices found matching "{searchTerm}"</p>
    <Button variant="link" onClick={clearSearch}>Clear search</Button>
  </div>
));

EmptyState.displayName = 'EmptyState';

export default DevicesPage;
