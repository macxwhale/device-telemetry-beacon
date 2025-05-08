
import { DeviceStatus, DeviceHistory, TelemetryData } from "@/types/telemetry";
import { getAllDevicesFromApi } from "@/api";

// Sample telemetry data for demo purposes
const sampleTelemetry: TelemetryData = {
  device_info: {
    device_name: "Sample Device",
    manufacturer: "Sample",
    brand: "Sample",
    model: "Sample Model",
    product: "Sample Product",
    android_id: "sample_id",
    imei: "sample_imei",
    is_emulator: false
  },
  system_info: {
    android_version: "14",
    sdk_int: 34,
    build_number: "SAMPLE.123",
    bootloader: "sample-bootloader",
    board: "sample-board",
    hardware: "sample-hardware",
    cpu_cores: 8,
    language: "en-US",
    timezone: "UTC",
    uptime_millis: 3600000,
    fingerprint: "sample/fingerprint/1"
  },
  battery_info: {
    battery_level: 75,
    battery_status: "Charging"
  },
  display_info: {
    screen_resolution: "1080x2340",
    screen_orientation: "portrait"
  },
  network_info: {
    ip_address: "192.168.1.100",
    network_interface: "WiFi",
    carrier: "Sample Carrier",
    wifi_ssid: "Sample_WiFi"
  },
  security_info: {
    is_rooted: false
  },
  app_info: {
    installed_apps: ["com.android.sample", "com.google.sample"]
  },
  os_type: "Android"
};

// Sample history data for charts
const sampleHistory: DeviceHistory[] = [
  {
    id: "e03c18c36f70be06-1",
    device_id: "e03c18c36f70be06",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    telemetry: {
      ...sampleTelemetry,
      battery_info: { ...sampleTelemetry.battery_info, battery_level: 100 },
      system_info: { ...sampleTelemetry.system_info, uptime_millis: 1000000 }
    }
  },
  {
    id: "e03c18c36f70be06-2",
    device_id: "e03c18c36f70be06",
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    telemetry: {
      ...sampleTelemetry,
      battery_info: { ...sampleTelemetry.battery_info, battery_level: 85 },
      system_info: { ...sampleTelemetry.system_info, uptime_millis: 7200000 }
    }
  },
  {
    id: "e03c18c36f70be06-3",
    device_id: "e03c18c36f70be06",
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    telemetry: {
      ...sampleTelemetry,
      battery_info: { ...sampleTelemetry.battery_info, battery_level: 70 },
      system_info: { ...sampleTelemetry.system_info, uptime_millis: 13400000 }
    }
  },
  {
    id: "e03c18c36f70be06-4",
    device_id: "e03c18c36f70be06",
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    telemetry: {
      ...sampleTelemetry,
      battery_info: { ...sampleTelemetry.battery_info, battery_level: 50 },
      system_info: { ...sampleTelemetry.system_info, uptime_millis: 19600000 }
    }
  },
  {
    id: "e03c18c36f70be06-5",
    device_id: "e03c18c36f70be06",
    timestamp: Date.now(),
    telemetry: {
      ...sampleTelemetry,
      battery_info: { ...sampleTelemetry.battery_info, battery_level: 40 },
      system_info: { ...sampleTelemetry.system_info, uptime_millis: 25800000 }
    }
  }
];

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
    isOnline: true,
    ip_address: "192.168.1.100",
    uptime_millis: 3600000,
    telemetry: { ...sampleTelemetry }
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
    isOnline: true,
    ip_address: "192.168.1.101",
    uptime_millis: 7200000,
    telemetry: { ...sampleTelemetry }
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
    isOnline: false,
    ip_address: "192.168.1.102",
    uptime_millis: 10800000,
    telemetry: { ...sampleTelemetry }
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
    isOnline: true,
    ip_address: "192.168.1.103",
    uptime_millis: 14400000,
    telemetry: { ...sampleTelemetry }
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

// Get device history data for charts
export const getDeviceHistory = async (deviceId: string): Promise<DeviceHistory[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // For the demo, return sample history data filtered by device ID
  return sampleHistory.filter(item => item.device_id === deviceId);
};
