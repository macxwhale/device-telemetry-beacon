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
  const [lastNotifiedBatteryDevices, setLastNotifiedBatteryDevices] = useState<Set<string>>(new Set());

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

  // Fetch devices from API - optimized
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDevices();
      
      // Check for new devices by comparing with known device IDs
      const newDeviceIds = new Set<string>();
      const newDevices = data.filter(device => {
        const isNew = !knownDeviceIds.has(device.id);
        if (isNew) newDeviceIds.add(device.id);
        return isNew;
      });
      
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
          ).catch(err => {
            console.error("Failed to send Telegram notification for new device:", err);
          });
        });
      }
      
      // Update known device IDs
      setKnownDeviceIds(prevIds => {
        const updated = new Set(prevIds);
        data.forEach(device => updated.add(device.id));
        return updated;
      });
      
      // Process devices and maintain online status with minimal state updates
      setDevices(prevDevices => {
        return data.map(newDevice => {
          const prevDevice = prevDevices.find(d => d.id === newDevice.id);
          const lastSeenDiff = Date.now() - newDevice.last_seen;
          const isOnline = lastSeenDiff < 15 * 60 * 1000;
          
          // If we have a previous device with the same status, keep its reference
          if (prevDevice && prevDevice.isOnline === isOnline) {
            return {
              ...newDevice,
              isOnline
            };
          }
          
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

  // Check for offline devices - optimized with reduced frequency
  const checkOfflineDevices = useCallback(() => {
    if (!notificationSettings) return;
    
    // Only run check every 60 seconds instead of every 30 seconds
    const now = Date.now();
    if (now - lastCheck < 60000) return;
    setLastCheck(now);
    
    setDevices(prev => {
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
        
        // Fix for duplicate low battery notifications
        // Check for low battery if the device is online and setting is enabled
        if (newIsOnline && 
            device.battery_level !== undefined && 
            device.battery_level <= 20 && 
            notificationSettings.notify_low_battery &&
            !lastNotifiedBatteryDevices.has(device.id) &&
            (device.battery_status !== "Charging" && device.battery_status !== "Full")) {
          
          // Add to set of notified devices to prevent duplicate notifications
          setLastNotifiedBatteryDevices(prev => {
            const updated = new Set(prev);
            updated.add(device.id);
            return updated;
          });
          
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
        
        // Reset notification if battery is charged again
        if (device.battery_level > 30 && lastNotifiedBatteryDevices.has(device.id)) {
          setLastNotifiedBatteryDevices(prev => {
            const updated = new Set(prev);
            updated.delete(device.id);
            return updated;
          });
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
  }, [notificationSettings, lastCheck, lastNotifiedBatteryDevices]);

  // Initial data load and interval setup with adjusted intervals
  useEffect(() => {
    fetchDevices();
    
    // Reduced frequency: Refresh data every 10 minutes instead of 5
    const fetchInterval = setInterval(() => {
      fetchDevices();
    }, 10 * 60 * 1000);
    
    // Reduced frequency: Check status every 2 minutes instead of 1
    const checkInterval = setInterval(() => {
      checkOfflineDevices();
    }, 2 * 60 * 1000);
    
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
