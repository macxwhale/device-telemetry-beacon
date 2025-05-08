
import { DeviceStatus } from "@/types/telemetry";
import { toast } from "@/components/ui/use-toast";

// Simulated in-memory database for demonstration
let deviceDatabase: DeviceStatus[] = [];

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
    const data = await request.json();
    
    // Extract device information
    const deviceId = data.android_id || data.device_info?.android_id;
    
    if (!deviceId) {
      return new Response(JSON.stringify({ error: "Missing device identifier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Process telemetry data
    const existingDeviceIndex = deviceDatabase.findIndex(device => device.id === deviceId);
    const timestamp = Date.now();
    
    let deviceData: DeviceStatus = {
      id: deviceId,
      name: data.device_info?.device_name || "Unknown Device",
      model: data.device_info?.model || "Unknown Model",
      manufacturer: data.device_info?.manufacturer || "Unknown Manufacturer",
      os_version: data.system_info?.android_version || data.os_type || "Unknown",
      battery_level: data.battery_info?.battery_level || 100,
      battery_status: data.battery_info?.battery_status || "Unknown",
      network_type: data.network_info?.network_interface || "Unknown",
      last_seen: timestamp,
      isOnline: true
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
      
      // Show toast for new device (if running in browser)
      if (typeof window !== "undefined") {
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
