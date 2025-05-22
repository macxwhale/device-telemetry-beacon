
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useDevices } from "@/contexts/DeviceContext";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

const DevicesPage = () => {
  const { devices, loading, refreshDevices } = useDevices();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter devices based on search term
  const filteredDevices = devices.filter(device => {
    const term = searchTerm.toLowerCase();
    return (
      device.name.toLowerCase().includes(term) ||
      device.model.toLowerCase().includes(term) ||
      device.manufacturer.toLowerCase().includes(term)
    );
  });
  
  useEffect(() => {
    document.title = "Devices - Device Telemetry";
  }, []);
  
  return (
    <Layout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Devices</h1>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={refreshDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {loading ? (
        <DeviceGrid>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </DeviceGrid>
      ) : filteredDevices.length === 0 ? (
        <EmptyState searchTerm={searchTerm} clearSearch={() => setSearchTerm("")} />
      ) : (
        <DeviceGrid>
          {filteredDevices.map(device => (
            <DeviceStatusCard key={device.id} device={device} />
          ))}
        </DeviceGrid>
      )}
    </Layout>
  );
};

// Extracted components to make the main component shorter
const DeviceGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {children}
  </div>
);

const EmptyState = ({ searchTerm, clearSearch }: { searchTerm: string, clearSearch: () => void }) => (
  <div className="text-center py-12">
    <p className="text-muted-foreground">No devices found matching "{searchTerm}"</p>
    <Button variant="link" onClick={clearSearch}>Clear search</Button>
  </div>
);

export default DevicesPage;
