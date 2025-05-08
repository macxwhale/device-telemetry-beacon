
// Non-JSX implementation of the telemetry API functions
// This file must not contain any JSX or React imports

// In-memory simulated database
let deviceDatabase: any[] = [];

// API key for simple authentication
const API_KEY = "telm_sk_1234567890abcdef";

/**
 * Handles telemetry API requests without JSX dependencies
 */
export async function handleTelemetryApiImplementation(request: Request): Promise<Response> {
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
    
    console.log("Received telemetry data:", JSON.stringify(data, null, 2));
    
    // Extract device identification
    // Handle both patterns (android_id directly in root or in device_info)
    const deviceId = data?.device_info?.android_id || data?.android_id || data?.device_id;
    
    if (!deviceId) {
      return new Response(JSON.stringify({ error: "Missing device identifier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Store device data in memory for simplicity
    const existingDeviceIndex = deviceDatabase.findIndex(device => device.id === deviceId);
    const timestamp = Date.now();
    
    const deviceData = {
      id: deviceId,
      name: data?.device_info?.device_name || "Unknown Device",
      model: data?.device_info?.model || "Unknown Model",
      manufacturer: data?.device_info?.manufacturer || "Unknown",
      os_version: data?.system_info?.android_version || "Unknown",
      battery_level: data?.battery_info?.battery_level || 0,
      battery_status: data?.battery_info?.battery_status || "Unknown",
      network_type: data?.network_info?.network_interface || "Unknown",
      ip_address: data?.network_info?.ip_address || "0.0.0.0",
      uptime_millis: data?.system_info?.uptime_millis || 0,
      last_seen: timestamp,
      isOnline: true,
      raw_data: data
    };
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      deviceDatabase[existingDeviceIndex] = {
        ...deviceDatabase[existingDeviceIndex],
        ...deviceData
      };
    } else {
      // Add new device
      deviceDatabase.push(deviceData);
    }
    
    console.log(`Device ${deviceId} data processed successfully`);
    
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
    return new Response(JSON.stringify({ error: "Internal server error", details: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Export a function to get all devices (simplified version)
export function getAllDevicesFromApiImplementation() {
  return deviceDatabase;
}
