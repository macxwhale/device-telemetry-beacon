
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Get Supabase credentials from environment
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://byvbunvegjwzgytavgkv.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // For each device, get the latest telemetry data
    const result = await Promise.all(devices.map(async (device) => {
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
        isOnline: (new Date().getTime() - new Date(device.last_seen).getTime()) < 5 * 60 * 1000, // 5 min
        telemetry: telemetryData
      };
    }));
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in get-devices function:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message,
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
