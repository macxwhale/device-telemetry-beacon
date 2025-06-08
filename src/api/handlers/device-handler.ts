// Handlers for device data operations

import { supabase } from "../../integrations/supabase/client";
import { DeviceStatus } from "../../types/telemetry";
import { getOfflineThreshold } from "../utils/settings-utils";
import { safelyGetNestedProperty } from "../utils/json-utils";

/**
 * Gets all devices from the database with their status
 */
export async function getAllDevicesFromApiImplementation(): Promise<DeviceStatus[]> {
  try {
    console.log('🔍 getAllDevicesFromApiImplementation: Starting device fetch...');
    
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
      console.error("❌ Error getting devices from database:", error);
      return [];
    }
    
    if (!devices || devices.length === 0) {
      console.log("📱 No devices found in database");
      return [];
    }
    
    console.log(`📱 Found ${devices.length} devices in database`);
    
    // For each device, get the latest telemetry data
    const result: DeviceStatus[] = await Promise.all(devices.map(async (device) => {
      console.log(`🔍 Processing device: ${device.device_name} (ID: ${device.id}, Android ID: ${device.android_id})`);
      
      const telemetryData = await getLatestDeviceTelemetry(device.id);
      
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
      
      console.log(`Device ${device.android_id}: last seen ${device.last_seen}, time diff: ${timeSinceLastSeen}ms, threshold: ${offlineThresholdMs}ms, online: ${isOnline}`);
      
      // Convert database record to DeviceStatus format
      // IMPORTANT: Use device.id (Supabase UUID) as the primary identifier
      const deviceStatus: DeviceStatus = {
        id: device.id, // ✅ Using Supabase UUID as primary identifier
        android_id: device.android_id, // Keep for reference
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
        isOnline: isOnline,
        telemetry: telemetryData
      };
      
      console.log(`✅ Processed device: ${deviceStatus.name} with ID: ${deviceStatus.id} and Android ID: ${deviceStatus.android_id}`);
      
      return deviceStatus;
    }));
    
    console.log(`✅ Processed ${result.length} devices total:`);
    console.log(`   - Online: ${result.filter(d => d.isOnline).length}`);
    console.log(`   - Offline: ${result.filter(d => !d.isOnline).length}`);
    console.log(`   - Sample device IDs: ${result.slice(0, 3).map(d => `${d.name}: ${d.id}`).join(', ')}`);
    
    return result;
  } catch (error) {
    console.error("💔 Error in getAllDevicesFromApiImplementation:", error);
    return [];
  }
}

/**
 * Gets the latest telemetry data for a device
 */
async function getLatestDeviceTelemetry(deviceId: string): Promise<any> {
  let telemetryData: any = null;
  let latestDeviceTelemetry = null;
  let latestTelemetryHistory = null;
  
  console.log(`🔍 Getting telemetry for device ID: ${deviceId}`);
  
  // Try to get data from device_telemetry table first
  try {
    const { data: deviceTelemetry, error: deviceTelemetryError } = await supabase
      .from('device_telemetry')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (deviceTelemetryError) {
      console.warn(`⚠️ Error getting device_telemetry for device ${deviceId}:`, deviceTelemetryError);
    } else if (deviceTelemetry) {
      latestDeviceTelemetry = deviceTelemetry;
      console.log(`✅ Found device_telemetry data for device ${deviceId}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to query device_telemetry for device ${deviceId}:`, error);
  }
  
  // Get latest telemetry record from history table
  const { data: telemetryRecords, error: telemetryError } = await supabase
    .from('telemetry_history')
    .select('telemetry_data, timestamp')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (telemetryError) {
    console.error(`❌ Error getting telemetry_history for device ${deviceId}:`, telemetryError);
  } else if (telemetryRecords) {
    latestTelemetryHistory = telemetryRecords;
    console.log(`✅ Found telemetry_history data for device ${deviceId}`);
  }
  
  // Use the most recent data from either source
  if (latestDeviceTelemetry && latestTelemetryHistory) {
    // Compare timestamps to determine which is more recent
    const deviceTelemetryTime = new Date(latestDeviceTelemetry.timestamp).getTime();
    const telemetryHistoryTime = new Date(latestTelemetryHistory.timestamp).getTime();
    
    if (deviceTelemetryTime >= telemetryHistoryTime) {
      console.log(`📊 Using device_telemetry data for device ${deviceId} (more recent)`);
      // ... keep existing code (structured device_telemetry data mapping)
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
      console.log(`📊 Using telemetry_history data for device ${deviceId} (more recent)`);
      // Use JSONB telemetry_history data
      telemetryData = latestTelemetryHistory.telemetry_data;
    }
  } else if (latestDeviceTelemetry) {
    console.log(`📊 Using device_telemetry data for device ${deviceId} (only source)`);
    // ... keep existing code (only have device_telemetry data)
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
    console.log(`📊 Using telemetry_history data for device ${deviceId} (only source)`);
    // Only have telemetry_history data
    telemetryData = latestTelemetryHistory.telemetry_data;
  } else {
    console.log(`⚠️ No telemetry data found for device ${deviceId}`);
  }
  
  return telemetryData;
}
