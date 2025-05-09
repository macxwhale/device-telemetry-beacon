
import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useDevices } from "@/contexts/DeviceContext";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

const DevicesPage = () => {
  const { devices, loading, error, refreshDevices } = useDevices();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Memoize filtered devices to prevent unnecessary re-renders
  const filteredDevices = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return devices.filter(device => {
      return (
        device.name.toLowerCase().includes(searchTermLower) ||
        device.model.toLowerCase().includes(searchTermLower) ||
        device.manufacturer.toLowerCase().includes(searchTermLower)
      );
    });
  }, [devices, searchTerm]);
  
  useEffect(() => {
    // Page title
    document.title = "Devices - Device Telemetry";
  }, []);
  
  const handleRefresh = () => {
    refreshDevices();
  };
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Devices</h1>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No devices found matching "{searchTerm}"</p>
          <Button variant="link" onClick={() => setSearchTerm("")}>Clear search</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDevices.map(device => (
            <DeviceStatusCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default DevicesPage;
