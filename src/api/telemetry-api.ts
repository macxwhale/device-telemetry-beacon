
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
  console.log("Telemetry API implementation: processing request");
  
  // Add CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
  
  // Add CORS headers for preflight requests
  if (request.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Verify it's a POST request
  if (request.method !== "POST") {
    console.error("Method not allowed:", request.method);
    return new Response(JSON.stringify({ 
      error: "Method not allowed", 
      allowed: "POST",
      received: request.method 
    }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  // Check authentication
  const authHeader = request.headers.get("Authorization");
  console.log("Auth header received:", authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
    console.error("Unauthorized request. Auth header:", authHeader);
    return new Response(JSON.stringify({ 
      error: "Unauthorized",
      details: "Invalid or missing API key",
      hint: "Use Authorization: Bearer telm_sk_1234567890abcdef"
    }), {
      status: 401,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  try {
    // Get the request body as text
    let bodyText = await request.text();
    console.log("Raw request body in telemetry API:", bodyText.substring(0, 500) + "...");
    
    // Parse JSON body
    let data;
    try {
      data = JSON.parse(bodyText);
      console.log("Parsed JSON successfully, found keys:", Object.keys(data));
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON format", 
        details: (parseError as Error).message,
        received_data: bodyText.substring(0, 100) + "..." // Include part of the raw data for debugging
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    console.log("Received telemetry data structure:", JSON.stringify(Object.keys(data)));
    
    // Extract device identification from all possible paths
    const deviceId = 
      data?.android_id || 
      data?.device_id || 
      (data?.device_info?.android_id) || 
      "";
    
    console.log("Extracted device ID:", deviceId);
    
    if (!deviceId) {
      console.error("Missing device identifier in payload");
      return new Response(JSON.stringify({ 
        error: "Missing device identifier",
        required: "android_id or device_info.android_id must be provided",
        received_keys: Object.keys(data),
        device_info: data.device_info ? JSON.stringify(data.device_info) : "No device_info found"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Store device data in memory for simplicity
    const existingDeviceIndex = deviceDatabase.findIndex(device => device.id === deviceId);
    const timestamp = Date.now();
    
    // Prepare device data object
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
      telemetry: data, // Store the entire telemetry data
      raw_data: data   // Keep raw data for backward compatibility
    };
    
    console.log("Processed device data:", JSON.stringify(deviceData, null, 2));
    
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
      device_id: deviceId,
      timestamp: timestamp
    };
    
    console.log("Sending response:", JSON.stringify(response));
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error("Error processing telemetry data:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message,
      stack: (error as Error).stack
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}

// Export a function to get all devices (simplified version)
export function getAllDevicesFromApiImplementation() {
  return deviceDatabase;
}
