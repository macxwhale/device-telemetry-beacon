
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { getAllDevices, deleteDevice } from "@/services/telemetryService";
import { toast } from "@/hooks/use-toast";
import { getGeneralSettings, GeneralSettings } from "@/services/settingsService";

interface DeviceContextType {
  devices: DeviceStatus[];
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  deleteDeviceById: (id: string) => Promise<boolean>;
  settings: GeneralSettings | null;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knownDeviceIds, setKnownDeviceIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const generalSettings = await getGeneralSettings();
        setSettings(generalSettings);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setSettings({
          system_name: "Device Telemetry Beacon",
          offline_threshold: 15,
          data_retention: 30,
          auto_refresh: true
        });
      }
    };
    
    loadSettings();
  }, []);

  // Delete device functionality
  const deleteDeviceById = async (deviceId: string): Promise<boolean> => {
    console.log(`DeviceContext: Deleting device ${deviceId}`);
    try {
      const result = await deleteDevice(deviceId);
      
      if (result.success) {
        // Update local state
        setDevices(prevDevices => 
          prevDevices.filter(device => device.id !== deviceId)
        );
        
        toast({
          title: "Device Deleted",
          description: result.message,
          variant: "default",
        });
        
        return true;
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete device",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (err) {
      console.error("Error deleting device:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the device",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Fetch devices from API
  const fetchDevices = useCallback(async (showLoadingState = !initialLoadComplete) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      
      const data = await getAllDevices();
      
      // Check for new devices
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
      
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
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
  }, [knownDeviceIds, initialLoadComplete]);

  // Initial data load and interval setup
  useEffect(() => {
    fetchDevices();
    
    if (settings?.auto_refresh) {
      const interval = setInterval(() => {
        fetchDevices(false); // Don't show loading state on background refresh
      }, 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [fetchDevices, settings]);

  return (
    <DeviceContext.Provider value={{
      devices,
      loading,
      error,
      refreshDevices: async () => await fetchDevices(true),
      deleteDeviceById,
      settings
    }}>
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
