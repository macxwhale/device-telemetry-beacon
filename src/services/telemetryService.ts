
import { DeviceHistory, DeviceStatus, TelemetryData } from "@/types/telemetry";

// Sample telemetry data based on the provided JSON
export const sampleTelemetryData: TelemetryData = {
  device_info: {
    device_name: "a13",
    manufacturer: "samsung",
    brand: "samsung",
    model: "SM-A135F",
    product: "a13nnxx",
    android_id: "e03c18c36f70be06",
    imei: "Permission Denied",
    is_emulator: false
  },
  system_info: {
    android_version: "14",
    sdk_int: 34,
    base_version: 1,
    fingerprint: "samsung/a13nnxx/a13:14/UP1A.231005.007/A135FXXSAEYA1:user/release-keys",
    build_number: "UP1A.231005.007.A135FXXSAEYA1",
    kernel_version: "Not Rooted | Failed to read kernel version",
    bootloader: "A135FXXSAEYA1",
    build_tags: "release-keys",
    build_type: "user",
    board: "exynos850",
    hardware: "exynos850",
    host: "SWDM8606",
    user: "dpi",
    uptime_millis: 1215161650,
    boot_time: 1744730667967,
    cpu_cores: 8,
    language: "en",
    timezone: "Africa/Nairobi"
  },
  battery_info: {
    battery_level: 68,
    battery_status: "Charging"
  },
  network_info: {
    ip_address: "105.231.176.224",
    network_interface: "Mobile",
    carrier: "SaveNaAirtelMoney",
    wifi_ssid: "Permission Denied"
  },
  display_info: {
    screen_resolution: "1080x2304",
    screen_orientation: "Portrait"
  },
  security_info: {
    is_rooted: false
  },
  app_info: {
    installed_apps: [
      "com.google.android.networkstack.tethering",
      "com.samsung.android.provider.filterprovider",
      // Only showing a few for brevity
      "com.android.vending"
    ]
  },
  timestamp: 1746723241879,
  android_id: "e03c18c36f70be06",
  os_type: "Android 10+",
  device_id: "restricted_on_android_10"
};

// Create some simulated devices
const generateRandomDevices = (): DeviceStatus[] => {
  const models = ["SM-A135F", "Pixel 7", "iPhone 13", "Redmi Note 10"];
  const manufacturers = ["Samsung", "Google", "Apple", "Xiaomi"];
  const osVersions = ["Android 14", "Android 13", "iOS 16", "Android 12"];
  const networkTypes = ["Mobile", "WiFi", "Mobile", "WiFi"];

  const devices: DeviceStatus[] = [];
  
  for (let i = 0; i < 10; i++) {
    const index = i % 4;
    const isOnline = Math.random() > 0.3; // 70% chance of being online
    const lastSeen = Date.now() - (isOnline ? (Math.random() * 10 * 60 * 1000) : (16 * 60 * 1000 + Math.random() * 60 * 60 * 1000));
    const batteryLevel = Math.floor(Math.random() * 100);
    
    devices.push({
      id: `device-${i+1}`,
      name: `Device-${i+1}`,
      model: models[index],
      manufacturer: manufacturers[index],
      os_version: osVersions[index],
      last_seen: lastSeen,
      battery_level: batteryLevel,
      battery_status: batteryLevel < 15 ? "Low" : batteryLevel < 90 ? "Discharging" : "Charging",
      network_type: networkTypes[index],
      ip_address: `192.168.1.${100 + i}`,
      uptime_millis: Math.floor(Math.random() * 1000000000),
      isOnline,
      telemetry: i === 0 ? sampleTelemetryData : null // Only one device has full telemetry data
    });
  }

  return devices;
};

// Simulate device history
const generateDeviceHistory = (deviceId: string): DeviceHistory[] => {
  const history: DeviceHistory[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (i * 60 * 60 * 1000);
    const telemetryData = {...sampleTelemetryData};
    
    // Modify sample data to create variations
    telemetryData.timestamp = timestamp;
    telemetryData.battery_info.battery_level = Math.max(10, Math.min(100, 68 - (i * 3) + Math.floor(Math.random() * 10)));
    telemetryData.battery_info.battery_status = telemetryData.battery_info.battery_level < 15 ? "Low" : 
      telemetryData.battery_info.battery_level > 90 ? "Charging" : "Discharging";
    telemetryData.system_info.uptime_millis = 1215161650 - (i * 60 * 60 * 1000);
    
    history.push({
      id: `${deviceId}-history-${i}`,
      timestamp,
      telemetry: telemetryData
    });
  }
  
  return history;
};

// Simulate our database
const deviceDatabase = {
  devices: generateRandomDevices(),
  history: new Map<string, DeviceHistory[]>()
};

// Initialize history for device 'device-1'
deviceDatabase.history.set('device-1', generateDeviceHistory('device-1'));

// Get all devices
export const getAllDevices = async (): Promise<DeviceStatus[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(deviceDatabase.devices);
    }, 500); // Simulate network latency
  });
};

// Get a specific device by ID
export const getDeviceById = async (deviceId: string): Promise<DeviceStatus | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const device = deviceDatabase.devices.find(d => d.id === deviceId) || null;
      resolve(device);
    }, 300);
  });
};

// Get device history
export const getDeviceHistory = async (deviceId: string): Promise<DeviceHistory[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const history = deviceDatabase.history.get(deviceId) || [];
      resolve(history);
    }, 500);
  });
};

// Simulate receiving new telemetry
export const receiveDeviceTelemetry = async (telemetry: TelemetryData): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find device by android_id
      const deviceIndex = deviceDatabase.devices.findIndex(
        d => d.id === 'device-1' // In a real app, we'd lookup by android_id
      );
      
      if (deviceIndex >= 0) {
        // Update device status
        deviceDatabase.devices[deviceIndex] = {
          ...deviceDatabase.devices[deviceIndex],
          last_seen: telemetry.timestamp,
          battery_level: telemetry.battery_info.battery_level,
          battery_status: telemetry.battery_info.battery_status,
          network_type: telemetry.network_info.network_interface,
          ip_address: telemetry.network_info.ip_address,
          uptime_millis: telemetry.system_info.uptime_millis,
          isOnline: true,
          telemetry
        };
        
        // Add to history
        const deviceHistory = deviceDatabase.history.get('device-1') || [];
        deviceHistory.unshift({
          id: `device-1-history-${deviceHistory.length}`,
          timestamp: telemetry.timestamp,
          telemetry
        });
        deviceDatabase.history.set('device-1', deviceHistory.slice(0, 100)); // Keep only last 100 entries
        
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};
