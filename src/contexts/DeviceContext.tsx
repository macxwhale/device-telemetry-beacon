
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { getAllDevices } from "@/services/telemetryService";
import { toast } from "@/hooks/use-toast";

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
  const [knownDeviceIds, setKnownDeviceIds] = useState<Set<string>>(new Set());

  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDevices();
      
      // Check for new devices by comparing with known device IDs
      const newDevices = data.filter(device => !knownDeviceIds.has(device.id));
      
      // Show notifications for new devices
      newDevices.forEach(device => {
        toast({
          title: "New Device Added",
          description: `${device.name} (${device.model}) has been added to your network`,
          variant: "default",
        });
      });
      
      // Update known device IDs
      setKnownDeviceIds(prev => {
        const updated = new Set(prev);
        data.forEach(device => updated.add(device.id));
        return updated;
      });
      
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
  }, [knownDeviceIds]);

  // Check for offline devices
  const checkOfflineDevices = useCallback(() => {
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
  }, []);

  // Initial data load and interval setup
  useEffect(() => {
    fetchDevices();
    
    const interval = setInterval(() => {
      checkOfflineDevices();
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDevices, checkOfflineDevices]);

  // Public API for context consumers
  const refreshDevices = async () => {
    await fetchDevices();
  };

  const contextValue = {
    devices,
    loading,
    error,
    refreshDevices
  };

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};

export function useDevices() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevices must be used within a DeviceProvider");
  }
  return context;
}
