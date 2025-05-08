
import { DeviceStatus, TelemetryData } from "@/types/telemetry";
import { toast } from "@/hooks/use-toast";

// Simulated in-memory database for demonstration
let deviceDatabase: DeviceStatus[] = [];

// Sample telemetry data for new devices
const defaultTelemetry: TelemetryData = {
  device_info: {
    device_name: "Unknown Device",
    manufacturer: "Unknown",
    brand: "Unknown",
    model: "Unknown",
    product: "Unknown",
    android_id: "unknown_id",
    imei: "unknown_imei",
    is_emulator: false
  },
  system_info: {
    android_version: "Unknown",
    sdk_int: 0,
    build_number: "Unknown",
    bootloader: "Unknown",
    board: "Unknown",
    hardware: "Unknown",
    cpu_cores: 0,
    language: "Unknown",
    timezone: "Unknown",
    uptime_millis: 0,
    fingerprint: "Unknown"
  },
  battery_info: {
    battery_level: 0,
    battery_status: "Unknown"
  },
  display_info: {
    screen_resolution: "Unknown",
    screen_orientation: "Unknown"
  },
  network_info: {
    ip_address: "0.0.0.0",
    network_interface: "Unknown",
    carrier: "Unknown",
    wifi_ssid: "Unknown"
  },
  security_info: {
    is_rooted: false
  },
  app_info: {
    installed_apps: []
  },
  os_type: "Unknown"
};

// API key for simple authentication
const API_KEY = "telm_sk_1234567890abcdef";

// Handler for telemetry API requests
export async function handleTelemetryApi(request: Request): Promise<Response> {
  // Verify it's a POST request
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Check authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Parse JSON body
    const data: any = await request.json();
    
    // Extract device information
    const deviceId = data?.android_id || data?.device_info?.android_id;
    
    if (!deviceId) {
      return new Response(JSON.stringify({ error: "Missing device identifier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Process telemetry data
    const existingDeviceIndex = deviceDatabase.findIndex(device => device.id === deviceId);
    const timestamp = Date.now();
    
    // Create a telemetry object from the data we received
    const telemetryData: TelemetryData = {
      device_info: {
        device_name: data?.device_info?.device_name || "Unknown Device",
        manufacturer: data?.device_info?.manufacturer || "Unknown",
        brand: data?.device_info?.brand || "Unknown",
        model: data?.device_info?.model || "Unknown Model",
        product: data?.device_info?.product || "Unknown",
        android_id: deviceId,
        imei: data?.device_info?.imei || "Unknown",
        is_emulator: data?.device_info?.is_emulator || false
      },
      system_info: {
        android_version: data?.system_info?.android_version || "Unknown",
        sdk_int: data?.system_info?.sdk_int || 0,
        build_number: data?.system_info?.build_number || "Unknown",
        bootloader: data?.system_info?.bootloader || "Unknown",
        board: data?.system_info?.board || "Unknown",
        hardware: data?.system_info?.hardware || "Unknown",
        cpu_cores: data?.system_info?.cpu_cores || 0,
        language: data?.system_info?.language || "Unknown",
        timezone: data?.system_info?.timezone || "Unknown",
        uptime_millis: data?.system_info?.uptime_millis || 0,
        fingerprint: data?.system_info?.fingerprint || "Unknown"
      },
      battery_info: {
        battery_level: data?.battery_info?.battery_level || 0,
        battery_status: data?.battery_info?.battery_status || "Unknown"
      },
      display_info: {
        screen_resolution: data?.display_info?.screen_resolution || "Unknown",
        screen_orientation: data?.display_info?.screen_orientation || "Unknown"
      },
      network_info: {
        ip_address: data?.network_info?.ip_address || "0.0.0.0",
        network_interface: data?.network_info?.network_interface || "Unknown",
        carrier: data?.network_info?.carrier || "Unknown",
        wifi_ssid: data?.network_info?.wifi_ssid || "Unknown"
      },
      security_info: {
        is_rooted: data?.security_info?.is_rooted || false
      },
      app_info: {
        installed_apps: Array.isArray(data?.app_info?.installed_apps) 
          ? data.app_info.installed_apps 
          : []
      },
      os_type: data?.os_type || "Unknown"
    };
    
    let deviceData: DeviceStatus = {
      id: deviceId,
      name: telemetryData.device_info.device_name,
      model: telemetryData.device_info.model,
      manufacturer: telemetryData.device_info.manufacturer,
      os_version: telemetryData.system_info.android_version,
      battery_level: telemetryData.battery_info.battery_level,
      battery_status: telemetryData.battery_info.battery_status,
      network_type: telemetryData.network_info.network_interface,
      last_seen: timestamp,
      isOnline: true,
      ip_address: telemetryData.network_info.ip_address,
      uptime_millis: telemetryData.system_info.uptime_millis,
      telemetry: telemetryData
    };
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      deviceDatabase[existingDeviceIndex] = {
        ...deviceDatabase[existingDeviceIndex],
        ...deviceData,
        last_seen: timestamp,
        isOnline: true
      };
    } else {
      // Add new device
      deviceDatabase.push(deviceData);
      
      // Show toast for new device (if in browser context)
      if (typeof window !== 'undefined') {
        toast({
          title: "New Device Connected",
          description: `${deviceData.name} (${deviceData.model}) has connected`,
          variant: "default",
        });
      }
    }
    
    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Telemetry data received",
      device_id: deviceId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error processing telemetry data:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Helper function to get all devices (for our frontend)
export function getAllDevicesFromApi(): DeviceStatus[] {
  return deviceDatabase;
}
