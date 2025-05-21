
// Handlers for telemetry data processing

import { supabase } from "../../integrations/supabase/client";
import { Tables, InsertTables } from "../../integrations/supabase/database.types";
import { createUnauthorizedResponse } from "../utils/auth-utils";
import { parseJsonBody } from "../utils/json-utils";
import { API_KEY } from "../utils/auth-utils";
import { getCorsHeaders } from "../utils/cors-headers";

/**
 * Handles telemetry API requests without JSX dependencies
 */
export async function handleTelemetryApiImplementation(request: Request): Promise<Response> {
  console.log("Telemetry API implementation: processing request");
  
  // Add CORS headers for all responses
  const corsHeaders = getCorsHeaders();
  
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
    return createUnauthorizedResponse();
  }

  try {
    const parsedBody = await parseJsonBody(request);
    
    if (!parsedBody.success) {
      console.error("JSON parsing error:", parsedBody.error);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON format", 
        details: parsedBody.error,
        received_data: parsedBody.rawBody?.substring(0, 200) + "...", 
        tip: "Make sure you're sending valid JSON without duplicate curly braces"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    const data = parsedBody.data;
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
        device_info: data.device_info ? JSON.stringify(data.device_info) : "No device_info found",
        data_sample: JSON.stringify(data).substring(0, 500) 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Process and store the telemetry data
    const result = await processTelemetryData(deviceId, data);

    // Return success response
    const response = {
      success: true, 
      message: "Telemetry data received and stored in database",
      device_id: deviceId,
      timestamp: result.timestamp,
      received_data_size: JSON.stringify(data).length,
      received_keys: Object.keys(data)
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

/**
 * Process and store telemetry data
 */
async function processTelemetryData(deviceId: string, data: any): Promise<{ deviceDbId: string; timestamp: string }> {
  // Prepare device data for database
  const timestamp = new Date().toISOString();
  
  // Check if device exists in database
  const { data: existingDevice, error: deviceCheckError } = await supabase
    .from('devices')
    .select('id')
    .eq('android_id', deviceId)
    .maybeSingle();
    
  if (deviceCheckError) {
    console.error("Error checking device in database:", deviceCheckError);
    throw new Error(`Database error: ${deviceCheckError.message}`);
  }
  
  let deviceDbId;
  
  // Insert or update device in database
  if (!existingDevice) {
    // Create new device
    const deviceData: InsertTables<'devices'> = {
      android_id: deviceId,
      device_name: data?.device_info?.device_name || "Unknown Device",
      manufacturer: data?.device_info?.manufacturer || "Unknown",
      model: data?.device_info?.model || "Unknown Model",
      last_seen: timestamp
    };
    
    const { data: newDevice, error: insertError } = await supabase
      .from('devices')
      .insert(deviceData)
      .select('id')
      .single();
      
    if (insertError) {
      console.error("Error inserting device to database:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }
    
    deviceDbId = newDevice?.id;
    console.log("Created new device in database with ID:", deviceDbId);
  } else {
    // Update existing device
    deviceDbId = existingDevice.id;
    
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        device_name: data?.device_info?.device_name || "Unknown Device",
        manufacturer: data?.device_info?.manufacturer || "Unknown",
        model: data?.device_info?.model || "Unknown Model",
        last_seen: timestamp
      })
      .eq('id', deviceDbId);
      
    if (updateError) {
      console.error("Error updating device in database:", updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }
    
    console.log("Updated existing device in database with ID:", deviceDbId);
  }
  
  // Store telemetry data in history
  const telemetryData = {
    device_id: deviceDbId,
    timestamp: timestamp,
    telemetry_data: data
  };
  
  const { error: telemetryError } = await supabase
    .from('telemetry_history')
    .insert(telemetryData);
    
  if (telemetryError) {
    console.error("Error storing telemetry data:", telemetryError);
    throw new Error(`Database error: ${telemetryError.message}`);
  }
  
  // Process installed apps if present
  await processInstalledApps(data, deviceDbId);
  
  return { deviceDbId, timestamp };
}

/**
 * Process installed apps from telemetry data
 */
async function processInstalledApps(data: any, deviceDbId: string): Promise<void> {
  if (data?.app_info?.installed_apps && Array.isArray(data.app_info.installed_apps)) {
    const apps = data.app_info.installed_apps;
    console.log(`Processing ${apps.length} apps for device with ID ${deviceDbId}`);
    
    // Prepare app data for database
    const appRows = apps.map((app: string) => ({
      device_id: deviceDbId,
      app_package: app
    }));
    
    if (appRows.length > 0) {
      const { error: appsError } = await supabase
        .from('device_apps')
        .upsert(appRows, { 
          onConflict: 'device_id,app_package', 
          ignoreDuplicates: true 
        });
        
      if (appsError) {
        console.error(`Warning: Error storing app data:`, appsError);
        // Continue even if app storage fails
      } else {
        console.log(`Successfully added ${apps.length} apps for device`);
      }
    }
  }
}
