
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { getAllDevices } from "@/services/telemetryService";
import { toast } from "@/components/ui/use-toast";

interface DeviceContextType {
  devices: DeviceStatus[];
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await getAllDevices();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch devices");
      toast({
        title: "Error",
        description: "Failed to fetch devices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Check for offline devices every minute
    const interval = setInterval(() => {
      setDevices(prev => 
        prev.map(device => {
          const lastSeenDiff = Date.now() - device.last_seen;
          // Mark device as offline if not seen in last 15 minutes
          const isOnline = lastSeenDiff < 15 * 60 * 1000;
          
          if (device.isOnline && !isOnline) {
            toast({
              title: "Device Offline",
              description: `${device.name} (${device.model}) is now offline`,
              variant: "destructive",
            });
          }
          
          return { ...device, isOnline };
        })
      );
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshDevices = async () => {
    await fetchDevices();
  };

  return (
    <DeviceContext.Provider value={{ devices, loading, error, refreshDevices }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevices must be used within a DeviceProvider");
  }
  return context;
};
