
import { safelyGetNestedProperty } from "../_shared/telemetry.ts";

// Extract telemetry from different sources and format device status
export function mapDeviceToDeviceStatus(device: any, telemetryData: any, offlineThresholdMs: number): any {
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
  
  // Calculate if device is online using settings-based offline threshold
  const lastSeenTime = new Date(device.last_seen).getTime();
  const timeSinceLastSeen = new Date().getTime() - lastSeenTime;
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
    last_seen: lastSeenTime,
    isOnline: isOnline, 
    telemetry: telemetryData
  };
}

// Maps structured device telemetry from the device_telemetry table to a standardized format
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
      cpu_cores: telemetryRecord.cpu_cores,
      language: telemetryRecord.language,
      timezone: telemetryRecord.timezone,
      uptime_millis: telemetryRecord.uptime_millis,
      fingerprint: telemetryRecord.fingerprint,
      base_version: telemetryRecord.base_version,
      build_tags: telemetryRecord.build_tags,
      build_type: telemetryRecord.build_type,
      host: telemetryRecord.host,
      user: telemetryRecord.user_name,
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
    },
    display_info: {
      screen_resolution: telemetryRecord.screen_resolution,
      screen_orientation: telemetryRecord.screen_orientation
    },
    security_info: {
      is_rooted: telemetryRecord.is_rooted
    },
    os_type: telemetryRecord.os_type
  };
}
