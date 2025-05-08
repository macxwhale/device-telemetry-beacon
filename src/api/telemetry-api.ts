
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
  console.log("Telemetry API request received");
  
  // Add CORS headers for preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  
  // Verify it's a POST request
  if (request.method !== "POST") {
    console.error("Method not allowed:", request.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // Check authentication
  const authHeader = request.headers.get("Authorization");
  console.log("Auth header received:", authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
    console.error("Unauthorized request. Auth header:", authHeader);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  try {
    // Clone the request to debug raw body
    const clonedRequest = request.clone();
    const bodyText = await clonedRequest.text();
    console.log("Raw request body:", bodyText.substring(0, 200) + "...");
    
    // Parse JSON body
    let data;
    try {
      data = JSON.parse(bodyText);
      console.log("Parsed JSON successfully, found keys:", Object.keys(data));
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON format", 
        details: (parseError as Error).message 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    console.log("Received telemetry data structure:", Object.keys(data));
    
    // Extract device identification - handle all possible paths
    const deviceId = 
      data?.android_id || 
      data?.device_id || 
      data?.device_info?.android_id || 
      "";
    
    console.log("Extracted device ID:", deviceId);
    
    if (!deviceId) {
      console.error("Missing device identifier in payload");
      return new Response(JSON.stringify({ 
        error: "Missing device identifier",
        received_keys: Object.keys(data),
        device_info_keys: data.device_info ? Object.keys(data.device_info) : "no device_info"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
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
      console.log(`Updated existing device ${deviceId}`);
    } else {
      // Add new device
      deviceDatabase.push(deviceData);
      console.log(`Added new device ${deviceId}`);
    }
    
    // Return success response
    const response = {
      success: true, 
      message: "Telemetry data received",
      device_id: deviceId
    };
    
    console.log("Sending response:", JSON.stringify(response));
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        // Add CORS headers to ensure the API is accessible
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
    
  } catch (error) {
    console.error("Error processing telemetry data:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

// Export a function to get all devices (simplified version)
export function getAllDevicesFromApiImplementation() {
  return deviceDatabase;
}
