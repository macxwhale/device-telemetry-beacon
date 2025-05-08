
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
    const data: any = await request.json();
    
    // Extract device information
    const deviceId = data?.android_id || data?.device_info?.android_id;
    
    if (!deviceId) {
      return new Response(JSON.stringify({ error: "Missing device identifier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Process telemetry data (simplified for non-JSX version)
    // This just handles the API response, the actual data processing will be done in the JSX file
    
    // Here we would normally process the data, but for now we'll just pass it to the JSX version
    // We'll use the dynamic import in the index.tsx file to handle the actual data processing
    
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

// Export a function to get all devices (simplified version)
export function getAllDevicesFromApiImplementation() {
  return deviceDatabase;
}
