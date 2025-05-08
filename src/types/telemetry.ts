
// Device telemetry types based on the provided JSON schema

export interface DeviceInfo {
  device_name: string;
  manufacturer: string;
  brand: string;
  model: string;
  product: string;
  android_id: string;
  imei: string;
  is_emulator: boolean;
}

export interface SystemInfo {
  android_version: string;
  sdk_int: number;
  base_version: number;
  fingerprint: string;
  build_number: string;
  kernel_version: string;
  bootloader: string;
  build_tags: string;
  build_type: string;
  board: string;
  hardware: string;
  host: string;
  user: string;
  uptime_millis: number;
  boot_time: number;
  cpu_cores: number;
  language: string;
  timezone: string;
}

export interface BatteryInfo {
  battery_level: number;
  battery_status: string;
}

export interface NetworkInfo {
  ip_address: string;
  network_interface: string;
  carrier: string;
  wifi_ssid: string;
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
  timestamp: number;
  android_id: string;
  os_type: string;
  device_id: string;
}

export interface DeviceStatus {
  id: string;
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
}

export interface DeviceHistory {
  id: string;
  timestamp: number;
  telemetry: TelemetryData;
}
