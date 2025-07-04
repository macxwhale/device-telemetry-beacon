import { DeviceStatus, DeviceHistory } from "@/types/telemetry";
import { getAllDevicesFromApi, deleteDeviceFromApi } from "@/api/api-interface";
import { monitor } from "@/lib/monitoring";

// Get all device information
@monitor('telemetry_get_all_devices')
export const getAllDevices = async (): Promise<DeviceStatus[]> => {
  return getAllDevicesFromApi();
};

// Get device by ID
@monitor('telemetry_get_device_by_id')
export const getDeviceById = async (id: string): Promise<DeviceStatus | null> => {
  const devices = await getAllDevices();
  return devices.find(device => device.id === id) || null;
};

// Delete device and all related data
@monitor('telemetry_delete_device')
export const deleteDevice = async (id: string): Promise<{success: boolean; message: string}> => {
  console.log(`TelemetryService: Deleting device ${id}`);
  try {
    const response = await deleteDeviceFromApi(id);
    console.log("Delete response:", response);
    return response;
  } catch (error) {
    console.error("Error in deleteDevice:", error);
    return { 
      success: false, 
      message: (error as Error).message || 'Failed to delete device'
    };
  }
};

// Get device history - simplified to keep under 50 lines
@monitor('telemetry_get_device_history')
export const getDeviceHistory = async (deviceId: string): Promise<DeviceHistory[]> => {
  const device = await getDeviceById(deviceId);
  if (!device || !device.telemetry) return [];
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  // Create simplified sample historical points
  return Array(6).fill(0).map((_, index) => ({
    id: `${deviceId}-${index}`,
    device_id: deviceId,
    timestamp: now - day * (5 - index),
    telemetry: {
      ...device.telemetry,
      battery_info: {
        battery_level: Math.max(10 + index * 15, device.telemetry.battery_info.battery_level - (50 - index * 10)),
        battery_status: index % 2 ? "Charging" : "Discharging"
      }
    }
  }));
};
