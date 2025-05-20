
import { safelyGetNestedProperty } from "../_shared/telemetry.ts";

/**
 * Maps a device record and telemetry data to a DeviceStatus object
 * @param device Device record from the database
 * @param telemetryData Telemetry data object
 * @param offlineThresholdMs Threshold in milliseconds to determine if a device is offline
 * @returns DeviceStatus object with online status correctly calculated
 */
export function mapDeviceToDeviceStatus(device: any, telemetryData: any, offlineThresholdMs: number): any {
  // Get IP address from all possible sources with priority order
  const ipAddress = 
    safelyGetNestedProperty(telemetryData, ['network_info', 'ethernet_ip'], null) || 
    safelyGetNestedProperty(telemetryData, ['network_info', 'wifi_ip'], null) || 
    safelyGetNestedProperty(telemetryData, ['network_info', 'mobile_ip'], null) || 
    safelyGetNestedProperty(telemetryData, ['network_info', 'ip_address'], "0.0.0.0");
  
  // Determine network type with fallbacks
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
  
  // Return the mapped device status with the correct online status
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
    last_seen: lastSeenTime,
    isOnline: isOnline, 
    telemetry: telemetryData
  };
}

/**
 * Maps structured device telemetry to a standardized format
 */
export function mapDeviceTelemetry(telemetryRecord: any): any {
  return {
    device_info: {
      device_name: telemetryRecord.device_name,
      manufacturer: telemetryRecord.manufacturer,
      brand: telemetryRecord.brand,
      model: telemetryRecord.model,
      product: telemetryRecord.product,
      android_id: telemetryRecord.android_id,
      imei: telemetryRecord.imei,
      is_emulator: telemetryRecord.is_emulator
    },
    system_info: {
      android_version: telemetryRecord.android_version,
      sdk_int: telemetryRecord.sdk_int,
      build_number: telemetryRecord.build_number,
      bootloader: telemetryRecord.bootloader,
      kernel_version: telemetryRecord.kernel_version,
      board: telemetryRecord.board,
      hardware: telemetryRecord.hardware,
      uptime_millis: telemetryRecord.uptime_millis,
      language: telemetryRecord.language,
      timezone: telemetryRecord.timezone,
      boot_time: telemetryRecord.boot_time
    },
    battery_info: {
      battery_level: telemetryRecord.battery_level,
      battery_status: telemetryRecord.battery_status
    },
    network_info: {
      ip_address: telemetryRecord.ip_address,
      network_interface: telemetryRecord.network_interface,
      carrier: telemetryRecord.carrier,
      wifi_ssid: telemetryRecord.wifi_ssid
    }
  };
}
