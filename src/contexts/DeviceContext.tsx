import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { DeviceStatus } from "@/types/telemetry";
import { getAllDevices } from "@/services/telemetryService";
import { toast } from "@/hooks/use-toast";
import { getNotificationSettings } from "@/services/notifications";
import { sendTelegramNotification } from "@/services/notifications/telegramService";

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
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  // Fetch notification settings
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const settings = await getNotificationSettings();
        setNotificationSettings(settings);
      } catch (err) {
        console.error("Failed to fetch notification settings:", err);
      }
    };
    
    fetchNotificationSettings();
  }, []);

  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDevices();
      
      // Check for new devices by comparing with known device IDs
      const newDevices = data.filter(device => !knownDeviceIds.has(device.id));
      
      // Show notifications for new devices if the setting is enabled
      if (notificationSettings?.notify_new_device && newDevices.length > 0) {
        // Process each new device for notifications
        newDevices.forEach(async device => {
          // UI Toast notification
          toast({
            title: "New Device Added",
            description: `${device.name} (${device.model}) has been added to your network`,
            variant: "default",
          });
          
          // Telegram notification
          await sendTelegramNotification(
            `🆕 New Device Added: ${device.name} (${device.model}) has been added to your network`,
            "new_device"
          );
        });
      }
      
      // Update known device IDs
      setKnownDeviceIds(prevIds => {
        const updated = new Set(prevIds);
        data.forEach(device => updated.add(device.id));
        return updated;
      });
      
      // Process devices and maintain online status
      setDevices(prevDevices => {
        return data.map(newDevice => {
          const prevDevice = prevDevices.find(d => d.id === newDevice.id);
          const lastSeenDiff = Date.now() - newDevice.last_seen;
          const isOnline = lastSeenDiff < 15 * 60 * 1000;
          
          return {
            ...newDevice,
            isOnline
          };
        });
      });
      
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
  }, [knownDeviceIds, notificationSettings]);

  // Check for offline devices - optimized to prevent unnecessary re-renders
  const checkOfflineDevices = useCallback(() => {
    if (!notificationSettings) return;
    
    // Only run check every 30 seconds instead of every second
    const now = Date.now();
    if (now - lastCheck < 30000) return;
    setLastCheck(now);
    
    setDevices(prev => {
      // Make a copy to track if anything actually changed
      let hasChanges = false;
      
      const updated = prev.map(device => {
        const lastSeenDiff = now - device.last_seen;
        // Mark device as offline if not seen in last 15 minutes
        const newIsOnline = lastSeenDiff < 15 * 60 * 1000;
        
        // Only trigger notifications if status changed from online to offline
        if (device.isOnline && !newIsOnline) {
          if (notificationSettings.notify_device_offline) {
            // UI Toast notification
            toast({
              title: "Device Offline",
              description: `${device.name} (${device.model}) is now offline`,
              variant: "destructive",
            });
            
            // Telegram notification
            sendTelegramNotification(
              `⚠️ Device Offline: ${device.name} (${device.model}) is now offline`,
              "device_offline"
            ).catch(err => {
              console.error("Failed to send Telegram notification for offline device:", err);
            });
          }
          
          // Mark that we have changes
          hasChanges = true;
        }
        
        // Check for low battery if the device is online and setting is enabled
        if (newIsOnline && 
            device.battery_level !== undefined && 
            device.battery_level <= 20 && 
            notificationSettings.notify_low_battery &&
            (device.battery_status !== "Charging" && device.battery_status !== "Full")) {
          // UI Toast notification
          toast({
            title: "Low Battery Warning",
            description: `${device.name} has ${device.battery_level}% battery remaining`,
            variant: "default",
          });
          
          // Telegram notification
          sendTelegramNotification(
            `🔋 Low Battery Warning: ${device.name} has ${device.battery_level}% battery remaining`,
            "low_battery"
          ).catch(err => {
            console.error("Failed to send Telegram notification for low battery:", err);
          });
          
          // Mark that we have changes
          hasChanges = true;
        }
        
        // Only update if the status actually changed
        if (device.isOnline !== newIsOnline) {
          hasChanges = true;
          return { ...device, isOnline: newIsOnline };
        }
        
        // Return unchanged device if no status change
        return device;
      });
      
      // Only return new array if something actually changed
      return hasChanges ? updated : prev;
    });
  }, [notificationSettings, lastCheck]);

  // Initial data load and interval setup
  useEffect(() => {
    fetchDevices();
    
    const fetchInterval = setInterval(() => {
      fetchDevices();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    const checkInterval = setInterval(() => {
      checkOfflineDevices();
    }, 60 * 1000); // Check status every minute
    
    return () => {
      clearInterval(fetchInterval);
      clearInterval(checkInterval);
    };
  }, [fetchDevices, checkOfflineDevices]);

  // Public API for context consumers
  const refreshDevices = async () => {
    await fetchDevices();
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    devices,
    loading,
    error,
    refreshDevices
  }), [devices, loading, error, refreshDevices]);

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
