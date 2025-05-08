
import { DeviceStatus } from "@/types/telemetry";
import { getAllDevicesFromApi } from "@/api";

// Sample data for development/demo purposes
const sampleDevices: DeviceStatus[] = [
  {
    id: "e03c18c36f70be06",
    name: "Samsung A13",
    model: "SM-A135F",
    manufacturer: "Samsung",
    os_version: "Android 14",
    battery_level: 68,
    battery_status: "Charging",
    network_type: "Mobile",
    last_seen: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    isOnline: true
  },
  {
    id: "a7bf43e215c9d840",
    name: "Pixel 7",
    model: "GVU6C",
    manufacturer: "Google",
    os_version: "Android 13",
    battery_level: 42,
    battery_status: "Discharging",
    network_type: "WiFi",
    last_seen: Date.now() - 2 * 60 * 1000, // 2 minutes ago
    isOnline: true
  },
  {
    id: "9d8f7c6e5b4a3210",
    name: "iPhone 13",
    model: "A2482",
    manufacturer: "Apple",
    os_version: "iOS 16.5",
    battery_level: 89,
    battery_status: "Full",
    network_type: "WiFi",
    last_seen: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    isOnline: false
  },
  {
    id: "1a2b3c4d5e6f7890",
    name: "OnePlus 9",
    model: "LE2115",
    manufacturer: "OnePlus",
    os_version: "Android 12",
    battery_level: 15,
    battery_status: "Low",
    network_type: "Mobile",
    last_seen: Date.now() - 8 * 60 * 1000, // 8 minutes ago
    isOnline: true
  }
];

// Get all devices from the API or use sample data
export const getAllDevices = async (): Promise<DeviceStatus[]> => {
  // Use a timer to simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Get data from our API implementation or use sample data if empty
  const apiDevices = getAllDevicesFromApi();
  return apiDevices.length > 0 ? apiDevices : sampleDevices;
};

// Get a single device by ID
export const getDeviceById = async (id: string): Promise<DeviceStatus | undefined> => {
  const devices = await getAllDevices();
  return devices.find(device => device.id === id);
};
