
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getOfflineThreshold } from "../_shared/telemetry.ts";
import { mapDeviceToDeviceStatus, mapDeviceTelemetry } from "./telemetry-mapper.ts";
import { getAllDevices, getLatestDeviceTelemetry, getLatestTelemetryHistory } from "./telemetry-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get offline threshold from database settings
    const offlineThreshold = await getOfflineThreshold();
    console.log(`Using offline threshold of ${offlineThreshold} minutes`);
    
    // Convert to milliseconds
    const offlineThresholdMs = offlineThreshold * 60 * 1000;
    
    // Get all devices from database
    const devices = await getAllDevices();
    
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
      let telemetryData = null;
      
      // Try to get data from device_telemetry table first
      const latestDeviceTelemetry = await getLatestDeviceTelemetry(device.id);
      
      // Get latest telemetry record from history table
      const latestTelemetryHistory = await getLatestTelemetryHistory(device.id);
      
      // Use the most recent data from either source
      if (latestDeviceTelemetry && latestTelemetryHistory) {
        // Compare timestamps to determine which is more recent
        const deviceTelemetryTime = new Date(latestDeviceTelemetry.timestamp).getTime();
        const telemetryHistoryTime = new Date(latestTelemetryHistory.timestamp).getTime();
        
        if (deviceTelemetryTime >= telemetryHistoryTime) {
          // Use structured device_telemetry data
          telemetryData = mapDeviceTelemetry(latestDeviceTelemetry);
        } else {
          // Use JSONB telemetry_history data
          telemetryData = latestTelemetryHistory.telemetry_data;
        }
      } else if (latestDeviceTelemetry) {
        // Only have device_telemetry data
        telemetryData = mapDeviceTelemetry(latestDeviceTelemetry);
      } else if (latestTelemetryHistory) {
        // Only have telemetry_history data
        telemetryData = latestTelemetryHistory.telemetry_data;
      }
      
      return mapDeviceToDeviceStatus(device, telemetryData, offlineThresholdMs);
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
