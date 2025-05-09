
// Non-JSX implementation of the telemetry API functions
// This file must not contain any JSX or React imports

import { supabase } from "@/integrations/supabase/client";

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
    console.log("Raw request body in telemetry API (first 1000 chars):", bodyText.substring(0, 1000));
    
    // Parse JSON body
    let data;
    try {
      // Remove any extra curly braces that might be causing JSON parse errors
      bodyText = bodyText.trim();
      if (bodyText.startsWith('{{') && bodyText.endsWith('}}')) {
        bodyText = bodyText.substring(1, bodyText.length - 1);
        console.log("Fixed double curly braces in JSON");
      }
      
      data = JSON.parse(bodyText);
      console.log("Parsed JSON successfully, found keys:", Object.keys(data));
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON format", 
        details: (parseError as Error).message,
        received_data: bodyText.substring(0, 200) + "...", // Include part of the raw data for debugging
        tip: "Make sure you're sending valid JSON without duplicate curly braces"
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
        device_info: data.device_info ? JSON.stringify(data.device_info) : "No device_info found",
        data_sample: JSON.stringify(data).substring(0, 500) // Include sample of the data for debugging
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

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
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: deviceCheckError.message
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    let deviceDbId;
    
    // Insert or update device in database
    if (!existingDevice) {
      // Create new device
      const { data: newDevice, error: insertError } = await supabase
        .from('devices')
        .insert({
          android_id: deviceId,
          device_name: data?.device_info?.device_name || "Unknown Device",
          manufacturer: data?.device_info?.manufacturer || "Unknown",
          model: data?.device_info?.model || "Unknown Model",
          last_seen: timestamp
        })
        .select('id')
        .single();
        
      if (insertError) {
        console.error("Error inserting device to database:", insertError);
        return new Response(JSON.stringify({ 
          error: "Database error", 
          details: insertError.message
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      
      deviceDbId = newDevice.id;
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
        return new Response(JSON.stringify({ 
          error: "Database error", 
          details: updateError.message
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      
      console.log("Updated existing device in database with ID:", deviceDbId);
    }
    
    // Store telemetry data in history
    const { error: telemetryError } = await supabase
      .from('telemetry_history')
      .insert({
        device_id: deviceDbId,
        timestamp: timestamp,
        telemetry_data: data
      });
      
    if (telemetryError) {
      console.error("Error storing telemetry data:", telemetryError);
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: telemetryError.message
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Process installed apps if present
    if (data?.app_info?.installed_apps && Array.isArray(data.app_info.installed_apps)) {
      const apps = data.app_info.installed_apps;
      console.log(`Processing ${apps.length} apps for device ${deviceId}`);
      
      // Prepare app data for database
      const appRows = apps.map(app => ({
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
          console.error("Warning: Error storing app data:", appsError);
          // Continue even if app storage fails
        } else {
          console.log(`Successfully added ${apps.length} apps for device`);
        }
      }
    }
    
    // Return success response
    const response = {
      success: true, 
      message: "Telemetry data received and stored in database",
      device_id: deviceId,
      timestamp: timestamp,
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

// Export a function to get all devices from database
export async function getAllDevicesFromApiImplementation() {
  try {
    // Get all devices from database
    const { data: devices, error } = await supabase
      .from('devices')
      .select(`
        id,
        android_id,
        device_name,
        manufacturer,
        model,
        first_seen,
        last_seen
      `);
      
    if (error) {
      console.error("Error getting devices from database:", error);
      return [];
    }
    
    // For each device, get the latest telemetry data
    const result = await Promise.all(devices.map(async (device) => {
      // Get latest telemetry record
      const { data: telemetryRecords, error: telemetryError } = await supabase
        .from('telemetry_history')
        .select('telemetry_data')
        .eq('device_id', device.id)
        .order('timestamp', { ascending: false })
        .limit(1);
        
      const telemetry = telemetryRecords && telemetryRecords.length > 0 
        ? telemetryRecords[0].telemetry_data
        : null;
        
      if (telemetryError) {
        console.error(`Error getting telemetry for device ${device.id}:`, telemetryError);
      }
      
      // Convert database record to DeviceStatus format
      return {
        id: device.android_id,
        name: device.device_name || "Unknown Device",
        model: device.model || "Unknown Model",
        manufacturer: device.manufacturer || "Unknown Manufacturer",
        os_version: telemetry?.system_info?.android_version || "Unknown",
        battery_level: telemetry?.battery_info?.battery_level || 0,
        battery_status: telemetry?.battery_info?.battery_status || "Unknown",
        network_type: telemetry?.network_info?.network_interface || "Unknown",
        ip_address: telemetry?.network_info?.ip_address || "0.0.0.0",
        uptime_millis: telemetry?.system_info?.uptime_millis || 0,
        last_seen: new Date(device.last_seen).getTime(),
        isOnline: (new Date().getTime() - new Date(device.last_seen).getTime()) < 5 * 60 * 1000, // 5 min
        telemetry: telemetry
      };
    }));
    
    return result;
  } catch (error) {
    console.error("Error in getAllDevicesFromApiImplementation:", error);
    return [];
  }
}

