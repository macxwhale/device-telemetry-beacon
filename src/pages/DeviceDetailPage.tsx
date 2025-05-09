import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getDeviceById, getDeviceHistory } from "@/services/telemetryService";
import { DeviceHeader } from "@/components/device/DeviceHeader";
import { DeviceDetails } from "@/components/device/DeviceDetails";
import { DeviceCharts } from "@/components/device/DeviceCharts";
import { DeviceHistory, DeviceStatus } from "@/types/telemetry";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useDevices } from "@/contexts/DeviceContext";

const DeviceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [history, setHistory] = useState<DeviceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshDevices } = useDevices();
  
  const fetchDeviceData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const deviceData = await getDeviceById(id);
      const deviceHistory = await getDeviceHistory(id);
      
      if (deviceData) {
        setDevice(deviceData);
        document.title = `${deviceData.name} - Device Telemetry`;
      }
      
      setHistory(deviceHistory);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch device details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    fetchDeviceData();
    refreshDevices();
    toast({
      title: "Refreshed",
      description: "Device data updated",
    });
  };
  
  useEffect(() => {
    fetchDeviceData();
  }, [id]);
  
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!device) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Device not found</h2>
          <p className="text-muted-foreground">The device you're looking for doesn't exist or has been removed.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <DeviceHeader device={device} onRefresh={handleRefresh} />
      
      {device.telemetry ? (
        <>
          <DeviceDetails telemetry={device.telemetry} />
          {history.length > 0 && <DeviceCharts history={history} />}
        </>
      ) : (
        <div className="mt-6 p-6 border rounded-md text-center">
          <p className="text-muted-foreground">
            No detailed telemetry data available for this device.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default DeviceDetailPage;
