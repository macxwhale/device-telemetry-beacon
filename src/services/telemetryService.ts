
import { DeviceStatus, DeviceHistory, TelemetryData } from "@/types/telemetry";
import { getAllDevicesFromApi } from "@/api";

// Get all device information
export const getAllDevices = async (): Promise<DeviceStatus[]> => {
  // Get devices from API which determines online status based on database settings
  return getAllDevicesFromApi();
};

// Get device by ID
export const getDeviceById = async (id: string): Promise<DeviceStatus | null> => {
  const devices = await getAllDevices();
  return devices.find(device => device.id === id) || null;
};

// Delete device and all related data
export const deleteDevice = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    // API call to delete device
    const response = await fetch(`/api/device/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete device');
    }
    
    return { success: true, message: 'Device deleted successfully' };
  } catch (error) {
    console.error("Error deleting device:", error);
    return { success: false, message: (error as Error).message || 'Failed to delete device' };
  }
};

// Get device history (simulated data for now)
export const getDeviceHistory = async (deviceId: string): Promise<DeviceHistory[]> => {
  // Simulate history data
  const device = await getDeviceById(deviceId);
  if (!device || !device.telemetry) return [];
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000; // 1 day in ms
  
  // Create sample historical points based on current data
  const history: DeviceHistory[] = [
    {
      id: `${deviceId}-1`,
      device_id: deviceId,
      timestamp: now - day * 5,
      telemetry: {
        ...device.telemetry,
        battery_info: {
          battery_level: Math.max(10, device.telemetry.battery_info.battery_level - 50),
          battery_status: "Discharging"
        }
      }
    },
    {
      id: `${deviceId}-2`,
      device_id: deviceId,
      timestamp: now - day * 4,
      telemetry: {
        ...device.telemetry,
        battery_info: {
          battery_level: Math.max(20, device.telemetry.battery_info.battery_level - 40),
          battery_status: "Charging"
        }
      }
    },
    {
      id: `${deviceId}-3`,
      device_id: deviceId,
      timestamp: now - day * 3,
      telemetry: {
        ...device.telemetry,
        battery_info: {
          battery_level: Math.max(40, device.telemetry.battery_info.battery_level - 30),
          battery_status: "Charging"
        }
      }
    },
    {
      id: `${deviceId}-4`,
      device_id: deviceId,
      timestamp: now - day * 2,
      telemetry: {
        ...device.telemetry,
        battery_info: {
          battery_level: Math.max(60, device.telemetry.battery_info.battery_level - 20),
          battery_status: "Full"
        }
      }
    },
    {
      id: `${deviceId}-5`,
      device_id: deviceId,
      timestamp: now - day,
      telemetry: {
        ...device.telemetry,
        battery_info: {
          battery_level: Math.max(70, device.telemetry.battery_info.battery_level - 10),
          battery_status: "Discharging"
        }
      }
    },
    {
      id: `${deviceId}-current`,
      device_id: deviceId,
      timestamp: now,
      telemetry: device.telemetry
    }
  ];
  
  return history;
};
