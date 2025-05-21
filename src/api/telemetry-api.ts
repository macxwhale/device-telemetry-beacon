// Non-JSX implementation of the telemetry API functions
// This file must not contain any JSX or React imports

import { supabase } from "../integrations/supabase/client";
import { DeviceStatus } from "../types/telemetry";
import { Database, Tables, InsertTables } from "../integrations/supabase/database.types";

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

// Helper function to safely access nested properties in JSON
function safelyGetNestedProperty(obj: any, path: string[], defaultValue: any = null): any {
  if (!obj) return defaultValue;
  
  try {
    // If obj is a string (which Json type can be), try to parse it
    const parsedObj = typeof obj === 'string' ? JSON.parse(obj) : obj;
    
    return path.reduce((prev: any, curr: string) => {
      return prev && typeof prev === 'object' ? prev[curr] : defaultValue;
    }, parsedObj);
  } catch (e) {
    console.error(`Error accessing path ${path.join('.')} in JSON:`, e);
    return defaultValue;
  }
}

/**
 * Get offline threshold from database settings
 */
async function getOfflineThreshold(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('additional_settings')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching offline threshold:", error);
      return 15; // Default to 15 minutes if error
    }
    
    // Extract offline_threshold from additional_settings if available
    const offlineThreshold = data?.additional_settings?.offline_threshold;
    return offlineThreshold || 15; // Default to 15 minutes if not found
  } catch (error) {
    console.error("Error in getOfflineThreshold:", error);
    return 15; // Default to 15 minutes on any error
  }
}

// Export a function to get all devices from database
export async function getAllDevicesFromApiImplementation(): Promise<DeviceStatus[]> {
  try {
    // Get offline threshold from database
    const offlineThreshold = await getOfflineThreshold();
    console.log(`Using offline threshold of ${offlineThreshold} minutes`);
    
    // Convert to milliseconds for timestamp comparison
    const offlineThresholdMs = offlineThreshold * 60 * 1000;
    
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
    
    if (!devices || devices.length === 0) {
      return [];
    }
    
    // For each device, get the latest telemetry data (either from device_telemetry or telemetry_history)
    const result: DeviceStatus[] = await Promise.all(devices.map(async (device) => {
      let telemetryData: any = null;
      let latestDeviceTelemetry = null;
      let latestTelemetryHistory = null;
      
      // Try to get data from device_telemetry table first
      try {
        const { data: deviceTelemetry, error: deviceTelemetryError } = await supabase
          .from('device_telemetry')
          .select('*')
          .eq('device_id', device.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (deviceTelemetryError) {
          console.warn(`Error getting device_telemetry for device ${device.id}:`, deviceTelemetryError);
        } else if (deviceTelemetry) {
          latestDeviceTelemetry = deviceTelemetry;
        }
      } catch (error) {
        console.warn(`Failed to query device_telemetry for device ${device.id}:`, error);
      }
      
      // Get latest telemetry record from history table
      const { data: telemetryRecords, error: telemetryError } = await supabase
        .from('telemetry_history')
        .select('telemetry_data, timestamp')
        .eq('device_id', device.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (telemetryError) {
        console.error(`Error getting telemetry for device ${device.id}:`, telemetryError);
      } else if (telemetryRecords) {
        latestTelemetryHistory = telemetryRecords;
      }
      
      // Use the most recent data from either source
      if (latestDeviceTelemetry && latestTelemetryHistory) {
        // Compare timestamps to determine which is more recent
        const deviceTelemetryTime = new Date(latestDeviceTelemetry.timestamp).getTime();
        const telemetryHistoryTime = new Date(latestTelemetryHistory.timestamp).getTime();
        
        if (deviceTelemetryTime >= telemetryHistoryTime) {
          // Use structured device_telemetry data
          telemetryData = {
            device_info: {
              device_name: latestDeviceTelemetry.device_name,
              manufacturer: latestDeviceTelemetry.manufacturer,
              brand: latestDeviceTelemetry.brand,
              model: latestDeviceTelemetry.model,
              product: latestDeviceTelemetry.product,
              android_id: latestDeviceTelemetry.android_id,
              imei: latestDeviceTelemetry.imei,
              is_emulator: latestDeviceTelemetry.is_emulator
            },
            system_info: {
              android_version: latestDeviceTelemetry.android_version,
              sdk_int: latestDeviceTelemetry.sdk_int,
              build_number: latestDeviceTelemetry.build_number,
              bootloader: latestDeviceTelemetry.bootloader,
              kernel_version: latestDeviceTelemetry.kernel_version,
              board: latestDeviceTelemetry.board,
              hardware: latestDeviceTelemetry.hardware,
              cpu_cores: latestDeviceTelemetry.cpu_cores,
              language: latestDeviceTelemetry.language,
              timezone: latestDeviceTelemetry.timezone,
              uptime_millis: latestDeviceTelemetry.uptime_millis,
              fingerprint: latestDeviceTelemetry.fingerprint,
              base_version: latestDeviceTelemetry.base_version,
              build_tags: latestDeviceTelemetry.build_tags,
              build_type: latestDeviceTelemetry.build_type,
              host: latestDeviceTelemetry.host,
              user: latestDeviceTelemetry.user_name,
              boot_time: latestDeviceTelemetry.boot_time
            },
            battery_info: {
              battery_level: latestDeviceTelemetry.battery_level,
              battery_status: latestDeviceTelemetry.battery_status
            },
            network_info: {
              ip_address: latestDeviceTelemetry.ip_address,
              network_interface: latestDeviceTelemetry.network_interface,
              carrier: latestDeviceTelemetry.carrier,
              wifi_ssid: latestDeviceTelemetry.wifi_ssid
            },
            display_info: {
              screen_resolution: latestDeviceTelemetry.screen_resolution,
              screen_orientation: latestDeviceTelemetry.screen_orientation
            },
            security_info: {
              is_rooted: latestDeviceTelemetry.is_rooted
            },
            os_type: latestDeviceTelemetry.os_type
          };
        } else {
          // Use JSONB telemetry_history data
          telemetryData = latestTelemetryHistory.telemetry_data;
        }
      } else if (latestDeviceTelemetry) {
        // Only have device_telemetry data
        telemetryData = {
          device_info: {
            device_name: latestDeviceTelemetry.device_name,
            manufacturer: latestDeviceTelemetry.manufacturer,
            brand: latestDeviceTelemetry.brand,
            model: latestDeviceTelemetry.model,
            product: latestDeviceTelemetry.product,
            android_id: latestDeviceTelemetry.android_id,
            imei: latestDeviceTelemetry.imei,
            is_emulator: latestDeviceTelemetry.is_emulator
          },
          system_info: {
            android_version: latestDeviceTelemetry.android_version,
            sdk_int: latestDeviceTelemetry.sdk_int,
            build_number: latestDeviceTelemetry.build_number,
            bootloader: latestDeviceTelemetry.bootloader,
            kernel_version: latestDeviceTelemetry.kernel_version,
            board: latestDeviceTelemetry.board,
            hardware: latestDeviceTelemetry.hardware,
            cpu_cores: latestDeviceTelemetry.cpu_cores,
            language: latestDeviceTelemetry.language,
            timezone: latestDeviceTelemetry.timezone,
            uptime_millis: latestDeviceTelemetry.uptime_millis,
            fingerprint: latestDeviceTelemetry.fingerprint,
            base_version: latestDeviceTelemetry.base_version,
            build_tags: latestDeviceTelemetry.build_tags,
            build_type: latestDeviceTelemetry.build_type,
            host: latestDeviceTelemetry.host,
            user: latestDeviceTelemetry.user_name,
            boot_time: latestDeviceTelemetry.boot_time
          },
          battery_info: {
            battery_level: latestDeviceTelemetry.battery_level,
            battery_status: latestDeviceTelemetry.battery_status
          },
          network_info: {
            ip_address: latestDeviceTelemetry.ip_address,
            network_interface: latestDeviceTelemetry.network_interface,
            carrier: latestDeviceTelemetry.carrier,
            wifi_ssid: latestDeviceTelemetry.wifi_ssid
          },
          display_info: {
            screen_resolution: latestDeviceTelemetry.screen_resolution,
            screen_orientation: latestDeviceTelemetry.screen_orientation
          },
          security_info: {
            is_rooted: latestDeviceTelemetry.is_rooted
          },
          os_type: latestDeviceTelemetry.os_type
        };
      } else if (latestTelemetryHistory) {
        // Only have telemetry_history data
        telemetryData = latestTelemetryHistory.telemetry_data;
      }
      
      // Get IP address from all possible sources with priority order
      const ipAddress = 
        safelyGetNestedProperty(telemetryData, ['network_info', 'ethernet_ip'], null) || 
        safelyGetNestedProperty(telemetryData, ['network_info', 'wifi_ip'], null) || 
        safelyGetNestedProperty(telemetryData, ['network_info', 'mobile_ip'], null) || 
        safelyGetNestedProperty(telemetryData, ['network_info', 'ip_address'], "0.0.0.0");
      
      // Determine network type with more fallbacks
      const networkType = 
        safelyGetNestedProperty(telemetryData, ['network_info', 'network_interface'], null) ||
        (safelyGetNestedProperty(telemetryData, ['network_info', 'wifi_ip'], null) ? "WiFi" : 
         safelyGetNestedProperty(telemetryData, ['network_info', 'mobile_ip'], null) ? "Mobile" : 
         safelyGetNestedProperty(telemetryData, ['network_info', 'ethernet_ip'], null) ? "Ethernet" : 
         "Unknown");
      
      // Calculate if device is online using the database settings-based threshold
      const lastSeenTime = new Date(device.last_seen).getTime();
      const currentTime = new Date().getTime();
      const timeSinceLastSeen = currentTime - lastSeenTime;
      const isOnline = timeSinceLastSeen < offlineThresholdMs;
      
      // Convert database record to DeviceStatus format
      return {
        id: device.android_id,
        name: device.device_name || "Unknown Device",
        model: device.model || "Unknown Model",
        manufacturer: device.manufacturer || "Unknown Manufacturer",
        os_version: safelyGetNestedProperty(telemetryData, ['system_info', 'android_version'], "Unknown"),
        battery_level: safelyGetNestedProperty(telemetryData, ['battery_info', 'battery_level'], 0),
        battery_status: safelyGetNestedProperty(telemetryData, ['battery_info', 'battery_status'], "Unknown"),
        network_type: networkType,
        ip_address: ipAddress,
        uptime_millis: safelyGetNestedProperty(telemetryData, ['system_info', 'uptime_millis'], 0),
        last_seen: new Date(device.last_seen).getTime(),
        isOnline: isOnline, // Use calculated online status with proper threshold
        telemetry: telemetryData
      };
    }));
    
    return result;
  } catch (error) {
    console.error("Error in getAllDevicesFromApiImplementation:", error);
    return [];
  }
}

// Export a function to delete a device and all related data
export async function deleteDeviceFromApiImplementation(deviceId: string): Promise<{success: boolean; message: string}> {
  try {
    console.log(`Attempting to delete device with ID ${deviceId}`);
    
    // First check if device exists
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, android_id, device_name')
      .eq('android_id', deviceId)
      .maybeSingle();
    
    if (deviceError) {
      console.error("Error checking device existence:", deviceError);
      return { success: false, message: `Database error: ${deviceError.message}` };
    }
    
    if (!device) {
      console.error("Device not found:", deviceId);
      return { success: false, message: "Device not found" };
    }
    
    const deviceDbId = device.id;
    const deviceName = device.device_name || "Unknown device";
    
    // Delete all related records in this order (to respect foreign keys):
    // 1. device_apps - apps installed on the device
    const { error: appsError } = await supabase
      .from('device_apps')
      .delete()
      .eq('device_id', deviceDbId);
      
    if (appsError) {
      console.error("Error deleting device apps:", appsError);
      // Continue with deletion even if this fails
    }
    
    // 2. device_telemetry - structured telemetry data
    const { error: telemetryError } = await supabase
      .from('device_telemetry')
      .delete()
      .eq('device_id', deviceDbId);
      
    if (telemetryError) {
      console.error("Error deleting device telemetry:", telemetryError);
      // Continue with deletion even if this fails
    }
    
    // 3. telemetry_history - raw telemetry data history
    const { error: historyError } = await supabase
      .from('telemetry_history')
      .delete()
      .eq('device_id', deviceDbId);
      
    if (historyError) {
      console.error("Error deleting telemetry history:", historyError);
      // Continue with deletion even if this fails
    }
    
    // 4. Finally delete the device record itself
    const { error: deleteError } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceDbId);
      
    if (deleteError) {
      console.error("Error deleting device:", deleteError);
      return { success: false, message: `Failed to delete device: ${deleteError.message}` };
    }
    
    console.log(`Successfully deleted device ${deviceName} (${deviceId}) with database ID ${deviceDbId}`);
    return { 
      success: true, 
      message: `Device ${deviceName} has been deleted along with all associated data` 
    };
  } catch (error) {
    console.error("Error in deleteDeviceFromApiImplementation:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${(error as Error).message}` 
    };
  }
}
