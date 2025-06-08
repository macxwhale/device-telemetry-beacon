
// Device telemetry types based on the provided JSON schema

export interface DeviceInfo {
  device_name: string;
  manufacturer: string;
  brand: string;
  model: string;
  product: string;
  android_id: string;
  imei?: string;
  is_emulator: boolean;
}

export interface SystemInfo {
  android_version: string;
  sdk_int: number;
  build_number: string;
  bootloader: string;
  board: string;
  hardware: string;
  cpu_cores: number;
  language: string;
  timezone: string;
  uptime_millis: number;
  fingerprint: string;
  base_version?: number;
  kernel_version?: string;
  build_tags?: string;
  build_type?: string;
  host?: string;
  user?: string;
  boot_time?: number;
}

export interface BatteryInfo {
  battery_level: number;
  battery_status: string;
}

export interface NetworkInfo {
  wifi_ip: string;
  mobile_ip?: string;
  ethernet_ip?: string;
  network_interface?: string;
  carrier: string;
  wifi_ssid: string;
  ip_address?: string; // For backward compatibility
}

export interface DisplayInfo {
  screen_resolution: string;
  screen_orientation: string;
}

export interface SecurityInfo {
  is_rooted: boolean;
}

export interface AppInfo {
  installed_apps: string[];
}

export interface TelemetryData {
  device_info: DeviceInfo;
  system_info: SystemInfo;
  battery_info: BatteryInfo;
  network_info: NetworkInfo;
  display_info: DisplayInfo;
  security_info: SecurityInfo;
  app_info: AppInfo;
  os_type: string;
  timestamp?: number;
  android_id?: string;
  device_id?: string;
}

export interface DeviceStatus {
  id: string;
  android_id?: string; // Added this property
  name: string;
  model: string;
  manufacturer: string;
  os_version: string;
  last_seen: number;
  battery_level: number;
  battery_status: string;
  network_type: string;
  ip_address: string;
  uptime_millis: number;
  isOnline: boolean;
  telemetry: TelemetryData | null;
  membership_id?: string; // Added this property for group memberships
}

export interface DeviceHistory {
  id: string;
  timestamp: number;
  telemetry: TelemetryData;
  device_id: string; // Changed from optional to required
}
