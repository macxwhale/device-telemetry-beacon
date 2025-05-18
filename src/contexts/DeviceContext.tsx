
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { getAllDevices } from "@/services/telemetryService";
import { toast } from "@/hooks/use-toast";
import { getGeneralSettings, GeneralSettings } from "@/services/settingsService";

interface DeviceContextType {
  devices: DeviceStatus[];
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  settings: GeneralSettings | null;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knownDeviceIds, setKnownDeviceIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<GeneralSettings | null>(null);

  // Fetch settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const generalSettings = await getGeneralSettings();
        setSettings(generalSettings);
      } catch (err) {
        console.error("Failed to load settings:", err);
        // If settings can't be loaded, use default values
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
      setKnownDeviceIds(prevIds => {
        const updated = new Set(prevIds);
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
  }, [knownDeviceIds]); // Include knownDeviceIds in the dependency array

  // Check for offline devices
  const checkOfflineDevices = useCallback(() => {
    if (!settings) return; // Wait until settings are loaded
    
    const offlineThresholdMs = settings.offline_threshold * 60 * 1000; // Convert minutes to ms
    
    setDevices(prev => 
      prev.map(device => {
        const lastSeenDiff = Date.now() - device.last_seen;
        // Use threshold from settings
        const isOnline = lastSeenDiff < offlineThresholdMs;
        
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
  }, [settings]); // Add settings to the dependency array

  // Initial data load and interval setup
  useEffect(() => {
    fetchDevices();
    
    // Only set up interval if settings are loaded and auto-refresh is enabled
    if (settings && settings.auto_refresh) {
      const interval = setInterval(() => {
        checkOfflineDevices();
      }, 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [fetchDevices, checkOfflineDevices, settings]);

  // Public API for context consumers
  const refreshDevices = async () => {
    await fetchDevices();
  };

  const contextValue = {
    devices,
    loading,
    error,
    refreshDevices,
    settings
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
