
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getOfflineThreshold } from "../_shared/telemetry.ts";
import { mapDeviceToDeviceStatus, mapDeviceTelemetry } from "./telemetry-mapper.ts";
import { getAllDevices, getLatestDeviceTelemetry, getLatestTelemetryHistory } from "./telemetry-service.ts";
import { createSuccessResponse, handleError } from "./error-handler.ts";

/**
 * Process device data by fetching and merging telemetry from multiple sources
 * @returns Array of device status objects
 */
async function processDevicesData(devices, offlineThresholdMs) {
  return Promise.all(devices.map(async (device) => {
    // Get telemetry from both sources
    const latestDeviceTelemetry = await getLatestDeviceTelemetry(device.id);
    const latestTelemetryHistory = await getLatestTelemetryHistory(device.id);
    
    // Determine which telemetry data is most recent
    let telemetryData = null;
    
    if (latestDeviceTelemetry && latestTelemetryHistory) {
      // Compare timestamps to determine which is more recent
      const deviceTelemetryTime = new Date(latestDeviceTelemetry.timestamp).getTime();
      const telemetryHistoryTime = new Date(latestTelemetryHistory.timestamp).getTime();
      
      telemetryData = deviceTelemetryTime >= telemetryHistoryTime
        ? mapDeviceTelemetry(latestDeviceTelemetry)
        : latestTelemetryHistory.telemetry_data;
    } else if (latestDeviceTelemetry) {
      telemetryData = mapDeviceTelemetry(latestDeviceTelemetry);
    } else if (latestTelemetryHistory) {
      telemetryData = latestTelemetryHistory.telemetry_data;
    }
    
    // Map device data using the offline threshold from database settings
    return mapDeviceToDeviceStatus(device, telemetryData, offlineThresholdMs);
  }));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get offline threshold from database settings
    const offlineThreshold = await getOfflineThreshold();
    console.log(`Using offline threshold of ${offlineThreshold} minutes`);
    
    // Convert to milliseconds for accurate timestamp comparison
    const offlineThresholdMs = offlineThreshold * 60 * 1000;
    
    // Get devices and process them with the correct threshold
    const devices = await getAllDevices();
    
    if (!devices || devices.length === 0) {
      return createSuccessResponse([]);
    }
    
    // Process device data with the threshold
    const result = await processDevicesData(devices, offlineThresholdMs);
    
    return createSuccessResponse(result);
  } catch (error) {
    return handleError(error);
  }
});
